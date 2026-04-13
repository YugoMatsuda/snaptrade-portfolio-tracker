import Foundation

final class TransactionsAPIGateway {
    private let client: Client

    init(client: Client) {
        self.client = client
    }

    func fetchTransactions(accountId: String) async throws -> [Transaction] {
        let response = try await client.transactions_period_getAll(
            .init(body: .json(.init(accountId: accountId)))
        )
        switch response {
        case .ok(let ok):
            let body = try ok.body.json
            return body.transactions.map { Transaction($0) }
        case .undocumented(let statusCode, _):
            throw TransactionsAPIGatewayError.unexpectedStatus(statusCode)
        }
    }
}

enum TransactionsAPIGatewayError: LocalizedError {
    case unexpectedStatus(Int)

    var errorDescription: String? {
        switch self {
        case .unexpectedStatus(let code): return "Unexpected status: \(code)"
        }
    }
}
