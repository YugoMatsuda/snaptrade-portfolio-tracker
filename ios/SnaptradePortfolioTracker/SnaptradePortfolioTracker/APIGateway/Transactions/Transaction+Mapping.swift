import OpenAPIRuntime

typealias APITransaction = Operations.transactions_period_getAll.Output.Ok.Body.jsonPayload.transactionsPayloadPayload

extension Transaction {
    init(_ t: APITransaction) {
        self.init(
            id: t.id,
            type: t._type,
            description: t.description,
            amount: t.amount,
            currency: t.currency,
            tradeDate: t.trade_date,
            ticker: t.ticker,
            units: t.units,
            price: t.price,
            fee: t.fee
        )
    }
}
