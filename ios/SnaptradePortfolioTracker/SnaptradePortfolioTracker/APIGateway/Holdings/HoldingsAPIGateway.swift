import OpenAPIRuntime
// HoldingsAPIGateway: Clientに依存し、APIを呼び出してDomainに変換して返す
final class HoldingsAPIGateway {
    private let client: Client

    init(client: Client) {
        self.client = client
    }

    func fetchHoldings(accountId: String) async throws -> Holdings {
        let response = try await client.holdings_period_getAll(.init(
            body: .json(.init(accountId: accountId))
        ))
        switch response {
        case .ok(let ok):
            let body = try ok.body.json
            return Holdings(body)
        case .undocumented(let statusCode, _):
            throw HoldingsAPIGatewayError.unexpectedStatus(statusCode)
        }
    }
}

enum HoldingsAPIGatewayError: Error {
    case unexpectedStatus(Int)
}
