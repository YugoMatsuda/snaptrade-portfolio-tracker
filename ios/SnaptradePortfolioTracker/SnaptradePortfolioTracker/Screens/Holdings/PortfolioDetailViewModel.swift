import Foundation
import Observation

@MainActor
@Observable
final class PortfolioDetailViewModel {
    enum State {
        case idle
        case loading
        case loaded(Holdings)
        case error(String)
    }

    var state: State = .idle
    var transactions: [Transaction] = []

    private let accountId: String
    private let holdingsGateway: HoldingsAPIGateway
    private let transactionsGateway: TransactionsAPIGateway

    init(holdingsGateway: HoldingsAPIGateway, transactionsGateway: TransactionsAPIGateway, accountId: String) {
        self.holdingsGateway = holdingsGateway
        self.transactionsGateway = transactionsGateway
        self.accountId = accountId
    }

    func fetch() async {
        state = .loading
        do {
            async let holdings = holdingsGateway.fetchHoldings(accountId: accountId)
            async let txns = transactionsGateway.fetchTransactions(accountId: accountId)
            let h = try await holdings
            state = .loaded(h)
            transactions = (try? await txns) ?? []
        } catch {
            state = .error(error.localizedDescription)
        }
    }
}
