import { unmarshalTx } from '@irisnet/amino-js';
import { base64ToBytes } from '@tendermint/belt';
import { SdkError } from '../errors';
import * as types from '../types';
import { Utils, Crypto } from '../utils';
import * as is from 'is_js';
import { WsClient } from './ws-client';

export interface EventDAO {
  setSubscription(id: string, subscription: types.EventSubscription): void;
  deleteSubscription(id: string): void;
  getAllSubscriptions(): Map<string, types.EventSubscription>;
  clear(): void;
}

class DefaultEventDAO implements EventDAO {
  private subscriptions = new Map<string, types.EventSubscription>();
  setSubscription(id: string, subscription: types.EventSubscription): void {
    this.subscriptions.set(id, subscription);
  }
  deleteSubscription(id: string): void {
    this.subscriptions.delete(id);
  }
  getAllSubscriptions(): Map<string, types.EventSubscription> {
    return this.subscriptions;
  }
  clear(): void {
    this.subscriptions = new Map<string, types.EventSubscription>();
  }
}

/**
 * IRISHub Event Listener
 */
export class EventListener {
  /** @hidden */
  private wsClient: WsClient;
  private eventDAO: EventDAO;
  constructor(url: string, eventDAO?: EventDAO) {
    this.wsClient = new WsClient(url);
    this.eventDAO = eventDAO ? eventDAO : new DefaultEventDAO();
  }

  /**
   * Connect to server
   */
  async connect(): Promise<boolean> {
    const promise = this.wsClient.connect();
    promise.then(connected => {
      if (connected) {
        const subscriptions = this.eventDAO.getAllSubscriptions();
        if (subscriptions) {
          subscriptions.forEach(sub => {
            // Re-Subscribe
            this.wsClient.send(types.RpcMethods.Subscribe, sub.id, sub.query);

            switch (sub.eventType) {
              case types.EventTypes.NewBlock: {
                // Listen for new blocks, decode and callback
                this.wsClient.eventEmitter.on(
                  sub.id + '#event',
                  (error, data) => {
                    this.newBlockHandler(sub.callback, error, data);
                  }
                );
                return;
              }
              case types.EventTypes.NewBlockHeader: {
                // Listen for new block headers, decode and callback
                this.wsClient.eventEmitter.on(
                  sub.id + '#event',
                  (error, data) => {
                    this.newBlockHandler(sub.callback, error, data);
                  }
                );
                return;
              }
              case types.EventTypes.ValidatorSetUpdates: {
                // Listen for new block headers, decode and callback
                this.wsClient.eventEmitter.on(
                  sub.id + '#event',
                  (error, data) => {
                    this.validatorSetUpdatesHandler(sub.callback, error, data);
                  }
                );
                return;
              }
              case types.EventTypes.Tx: {
                // Listen for new block headers, decode and callback
                this.wsClient.eventEmitter.on(
                  sub.id + '#event',
                  (error, data) => {
                    this.txHandler(sub.callback, error, data);
                  }
                );
                return;
              }
              default: {
                return;
              }
            }
          });
        }
      }
    });

    return promise;
  }

  /**
   * Disconnect from server
   */
  async disconnect(): Promise<boolean> {
    const promise = this.wsClient.disconnect();
    promise.then(disconnected => {
      if (disconnected) {
        this.eventDAO.clear();
      }
    });
    return promise;
  }

  /**
   * Subscribe new block notifications
   * @param callback A function to receive notifications
   * @returns
   */
  subscribeNewBlock(
    callback: (error?: SdkError, data?: types.EventDataNewBlock) => void
  ): types.EventSubscription {
    // Build and send subscription
    const eventType = types.EventTypes.NewBlock;
    const id = eventType + Math.random().toString(16);
    const query = new EventQueryBuilder()
      .addCondition(EventKey.Type, eventType)
      .build();

    this.wsClient.send(types.RpcMethods.Subscribe, id, query);

    // Listen for new blocks, decode and callback
    this.wsClient.eventEmitter.on(id + '#event', (error, data) => {
      this.newBlockHandler(callback, error, data);
    });

    const subscription = { id, query, eventType, callback };
    this.eventDAO.setSubscription(id, subscription);
    // Return an types.EventSubscription instance, so client could use to unsubscribe this context
    return subscription;
  }

  /**
   * Subscribe new block header notifications
   * @param callback A function to receive notifications
   * @returns
   */
  subscribeNewBlockHeader(
    callback: (error?: SdkError, data?: types.EventDataNewBlockHeader) => void
  ): types.EventSubscription {
    // Build and send subscription
    const eventType = types.EventTypes.NewBlockHeader;
    const id = eventType + Math.random().toString(16);
    const query = new EventQueryBuilder()
      .addCondition(EventKey.Type, eventType)
      .build();

    this.wsClient.send(types.RpcMethods.Subscribe, id, query);

    // Listen for new block headers, decode and callback
    this.wsClient.eventEmitter.on(id + '#event', (error, data) => {
      this.newBlockHeaderHandler(callback, error, data);
    });

    const subscription = { id, query, eventType, callback };
    this.eventDAO.setSubscription(id, subscription);
    // Return an types.EventSubscription instance, so client could use to unsubscribe this context
    return subscription;
  }

  /**
   * Subscribe validator set update notifications
   * @param callback A function to receive notifications
   * @returns
   */
  subscribeValidatorSetUpdates(
    callback: (
      error?: SdkError,
      data?: types.EventDataValidatorSetUpdates[]
    ) => void
  ): types.EventSubscription {
    // Build and send subscription
    const eventType = types.EventTypes.ValidatorSetUpdates;
    const id = eventType + Math.random().toString(16);
    const query = new EventQueryBuilder()
      .addCondition(EventKey.Type, eventType)
      .build();

    this.wsClient.send(types.RpcMethods.Subscribe, id, query);

    // Listen for validator set updates, decode and callback
    this.wsClient.eventEmitter.on(id + '#event', (error, data) => {
      this.validatorSetUpdatesHandler(callback, error, data);
    });

    const subscription = { id, query, eventType, callback };
    this.eventDAO.setSubscription(id, subscription);
    // Return an types.EventSubscription instance, so client could use to unsubscribe this context
    return subscription;
  }

  /**
   * Subscribe successful Txs notifications
   * @param callback A function to receive notifications
   * @returns
   */
  subscribeTx(
    conditions: EventQueryBuilder,
    callback: (error?: SdkError, data?: types.EventDataResultTx) => void
  ): types.EventSubscription {
    // Build and send subscription
    const eventType = types.EventTypes.Tx;
    const id = eventType + Math.random().toString(16);
    const queryBuilder = conditions ? conditions : new EventQueryBuilder();
    const query = queryBuilder.addCondition(EventKey.Type, eventType).build();

    this.wsClient.send(types.RpcMethods.Subscribe, id, query);

    // Listen for txs, decode and callback
    this.wsClient.eventEmitter.on(id + '#event', (error, data) => {
      this.txHandler(callback, error, data);
    });

    const subscription = { id, query, eventType, callback };
    this.eventDAO.setSubscription(id, subscription);
    // Return an types.EventSubscription instance, so client could use to unsubscribe this context
    return subscription;
  }

  /**
   * Unsubscribe the specified event
   * @param subscription The event subscription instance
   */
  unscribe(subscription: types.EventSubscription): void {
    // Unsubscribe the specified event from server
    this.wsClient.send(
      types.RpcMethods.Unsubscribe,
      'unsubscribe#' + subscription.id,
      subscription.query
    );
    this.wsClient.eventEmitter.on(
      'unsubscribe#' + subscription.id + '#event',
      (error, data) => {
        console.log(error);
        console.log(data);
        // Remove the subscription listeners
        this.wsClient.eventEmitter.removeAllListeners(
          subscription.id + '#event'
        );
        // Remove the current `unsubscribe` operation listener
        this.wsClient.eventEmitter.removeAllListeners(
          'unsubscribe#' + subscription.id + '#event'
        );
      }
    );
  }

  private newBlockHandler(
    callback: (error?: SdkError, data?: types.EventDataNewBlock) => void,
    error?: any,
    data?: any
  ): void {
    if (error) {
      callback(new SdkError(error.message, error.code), undefined);
    }

    if (!data || !data.data || !data.data.value) {
      return;
    }

    const blockData = data.data.value;

    // Decode txs
    if (blockData.block && blockData.block.data && blockData.block.data.txs) {
      const txs: string[] = blockData.block.data.txs;
      const decodedTxs = new Array<types.Tx<types.StdTx>>();
      txs.forEach(msg => {
        decodedTxs.push(
          unmarshalTx(base64ToBytes(msg)) as types.Tx<types.StdTx>
        );
      });
      blockData.block.data.txs = decodedTxs;
      console.log(JSON.stringify(decodedTxs));
    }

    const eventBlock = blockData as types.EventDataNewBlock;
    callback(undefined, eventBlock);
  }

  private newBlockHeaderHandler(
    callback: (error?: SdkError, data?: types.EventDataNewBlockHeader) => void,
    error: any,
    data: any
  ) {
    if (error) {
      callback(new SdkError(error.message, error.code), undefined);
    }

    if (!data.data || !data.data.value) {
      return;
    }
    const eventBlockHeader = data.data.value as types.EventDataNewBlockHeader;
    callback(undefined, eventBlockHeader);
  }

  private validatorSetUpdatesHandler(
    callback: (
      error?: SdkError,
      data?: types.EventDataValidatorSetUpdates[]
    ) => void,
    error: any,
    data: any
  ) {
    if (error) {
      callback(new SdkError(error.message, error.code), undefined);
    }

    if (!data.data || !data.data.value || !data.data.value.validator_updates) {
      return;
    }
    const eventValidatorUpdates = data.data.value
      .validator_updates as types.EventDataValidatorSetUpdates[];
    callback(undefined, eventValidatorUpdates);
  }

  private txHandler(
    callback: (error?: SdkError, data?: types.EventDataResultTx) => void,
    error: any,
    data: any
  ) {
    if (error) {
      callback(new SdkError(error.message, error.code), undefined);
    }

    if (!data || !data.data || !data.data.value || !data.data.value.TxResult) {
      return;
    }

    const txResult = data.data.value.TxResult;
    txResult.tx = unmarshalTx(base64ToBytes(txResult.tx));

    // Decode tags from base64
    if (txResult.result.tags) {
      const tags = txResult.result.tags as types.Tag[];
      const decodedTags = new Array<types.Tag>();
      tags.forEach(element => {
        const key = Utils.base64ToString(element.key);
        const value =
          !element.value || is.empty(element.value)
            ? ''
            : Utils.base64ToString(element.value);
        decodedTags.push({
          key,
          value,
        });
      });
      txResult.result.tags = decodedTags;
    }

    txResult.hash = Crypto.generateTxHash(txResult.tx);

    callback(undefined, txResult);
  }
}

/**
 * A builder for building event query strings
 */
export class EventQueryBuilder {
  private conditions = new Array<string>();

  /**
   * Add a query condition
   * @param eventKey
   * @param value
   * @returns The builder itself
   */
  addCondition(
    eventKey: EventKey,
    value: string | EventAction
  ): EventQueryBuilder {
    this.conditions.push(eventKey + "='" + value + "'");
    return this;
  }

  /**
   * Convert the current builder to the query string
   * @returns The query string
   */
  build(): string {
    return this.conditions.join(' and ');
  }
}

export enum EventKey {
  Type = 'tm.event',
  Action = 'action',
  Sender = 'sender',
  Recipient = 'recipient',
  DestinationValidator = 'destination-validator',
  // TODO: more
}

export enum EventAction {
  Send = 'send',
  Burn = 'burn',
  SetMemoRegexp = 'set-memo-regexp',
  EditValidator = 'edit_validator',
  // TODO: more
}
