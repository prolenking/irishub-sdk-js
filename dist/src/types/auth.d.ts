import { PubKey } from '@irisnet/amino-js/types';
import { Coin, Msg, TxValue } from './types';
/** Standard Tx */
export interface StdTx extends TxValue {
    msg: Msg[];
    fee: StdFee;
    signatures: StdSignature[];
    memo: string;
}
/** Standard Fee */
export interface StdFee {
    amount: Coin[];
    gas: string;
}
/** Standard Signature */
export interface StdSignature {
    pub_key?: PubKey;
    signature?: string;
    account_number: string;
    sequence: string;
}
/** Base params for the transaction */
export interface BaseTx {
    /** Name of the key */
    from: string;
    /** Password of the key */
    password: string;
    gas?: string | undefined;
    fee?: Coin | undefined;
    memo?: string | undefined;
    mode?: BroadcastMode | undefined;
}
/**
 * Broadcast Mode
 * - Sync: Broadcast transactions synchronously and wait for the recipient node to validate the txs
 * - Async: Broadcast transactions asynchronously and returns immediately
 * - Commit: Broadcast transactions and wait until the transactions are included by a block
 */
export declare enum BroadcastMode {
    Sync = 0,
    Async = 1,
    Commit = 2
}
/** Standard Msg to sign */
export interface StdSignMsg {
    account_number: string;
    chain_id: string;
    fee: StdFee;
    memo: string;
    msgs: object[];
    sequence: string;
}
