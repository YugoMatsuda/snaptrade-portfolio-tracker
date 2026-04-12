// Holdings ドメインモデル
// APIレスポンスのoptionalを排除したクリーンなSwift型

struct HoldingPosition {
    let ticker: String
    let name: String
    let units: Double
    let price: Double
    let openPnl: Double
    let averagePurchasePrice: Double
    let currency: String
}

struct HoldingBalance {
    let currency: String
    let cash: Double
    let buyingPower: Double
}

struct Holdings {
    let positions: [HoldingPosition]
    let balances: [HoldingBalance]
    let totalValue: Double
    let currency: String
}
