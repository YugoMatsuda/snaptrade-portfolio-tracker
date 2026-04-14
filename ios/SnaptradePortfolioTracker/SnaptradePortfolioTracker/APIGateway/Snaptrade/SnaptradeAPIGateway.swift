import Foundation
// SnaptradeAPIGateway: Depends on Client, calls APIs and converts responses to Domain models
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

    func fetchConnections() async throws -> [Connection] {
        let response = try await client.snaptrade_period_accounts(.init(body: .json(.init())))
        switch response {
        case .ok(let ok):
            let body = try ok.body.json
            return body.connections.map { Connection($0) }
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

    func reconnect(authorizationId: String) async throws -> String {
        let response = try await client.snaptrade_period_reconnect(
            .init(body: .json(.init(authorizationId: authorizationId)))
        )
        switch response {
        case .ok(let ok):
            return try ok.body.json.redirectURI
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
