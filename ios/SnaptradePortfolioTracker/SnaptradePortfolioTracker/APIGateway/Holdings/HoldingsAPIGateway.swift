import Foundation
import OpenAPIRuntime
// HoldingsAPIGateway: Depends on Client, calls APIs and converts responses to Domain models
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

enum HoldingsAPIGatewayError: LocalizedError {
    case unexpectedStatus(Int)

    var errorDescription: String? {
        switch self {
        case .unexpectedStatus(let code): return "Unexpected status: \(code)"
        }
    }
}
