import Foundation
// SnaptradeAPIGateway: Clientに依存し、APIを呼び出してDomainに変換して返す
final class SnaptradeAPIGateway {
    private let client: Client

    init(client: Client) {
        self.client = client
    }

    func connect() async throws -> String {
        let response = try await client.snaptrade_period_connect(.init(body: .json(.init())))
        switch response {
        case .ok(let ok):
            let body = try ok.body.json
            return body.redirectURI
        case .undocumented(let statusCode, _):
            throw SnaptradeAPIGatewayError.unexpectedStatus(statusCode)
        }
    }

    func fetchAccounts() async throws -> [Account] {
        let response = try await client.snaptrade_period_accounts(.init(body: .json(.init())))
        switch response {
        case .ok(let ok):
            let body = try ok.body.json
            return body.accounts.map { Account($0) }
        case .undocumented(let statusCode, _):
            throw SnaptradeAPIGatewayError.unexpectedStatus(statusCode)
        }
    }

    func sync() async throws {
        let response = try await client.snaptrade_period_sync(.init(body: .json(.init())))
        switch response {
        case .ok:
            return
        case .undocumented(let statusCode, _):
            throw SnaptradeAPIGatewayError.unexpectedStatus(statusCode)
        }
    }

    func deleteConnection(authorizationId: String) async throws {
        let response = try await client.snaptrade_period_deleteConnection(
            .init(body: .json(.init(authorizationId: authorizationId)))
        )
        switch response {
        case .ok:
            return
        case .undocumented(let statusCode, _):
            throw SnaptradeAPIGatewayError.unexpectedStatus(statusCode)
        }
    }

    func deleteSnapTradeUser() async throws {
        let response = try await client.snaptrade_period_deleteSnapTradeUser(.init(body: .json(.init())))
        switch response {
        case .ok:
            return
        case .undocumented(let statusCode, _):
            throw SnaptradeAPIGatewayError.unexpectedStatus(statusCode)
        }
    }
}

enum SnaptradeAPIGatewayError: LocalizedError {
    case unexpectedStatus(Int)

    var errorDescription: String? {
        switch self {
        case .unexpectedStatus(let code): return "Unexpected status: \(code)"
        }
    }
}
