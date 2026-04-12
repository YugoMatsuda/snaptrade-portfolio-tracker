import OpenAPIRuntime

// APIレスポンス → Holdingsドメインへの変換
// Domain型はOpenAPIに依存しないよう、マッピングはService層のextensionで行う

typealias APIResponse = Operations.holdings_period_getAll.Output.Ok.Body.jsonPayload

extension Holdings {
    init(_ response: APIResponse) {
        self.init(
            positions: response.positions.compactMap { HoldingPosition($0) },
            balances: response.balances.compactMap { HoldingBalance($0) },
            totalValue: response.total_value ?? 0,
            currency: response.currency ?? ""
        )
    }
}

extension HoldingPosition {
    init?(_ p: APIResponse.positionsPayloadPayload) {
        guard let ticker = p.symbol?.symbol?.symbol else { return nil }
        self.init(
            ticker: ticker,
            name: p.symbol?.symbol?.description ?? "",
            units: p.units ?? 0,
            price: p.price ?? 0,
            openPnl: p.open_pnl ?? 0,
            averagePurchasePrice: p.average_purchase_price ?? 0,
            currency: p.currency?.code ?? ""
        )
    }
}

extension HoldingBalance {
    init?(_ b: APIResponse.balancesPayloadPayload) {
        guard let currency = b.currency?.code else { return nil }
        self.init(
            currency: currency,
            cash: b.cash ?? 0,
            buyingPower: b.buying_power ?? 0
        )
    }
}
