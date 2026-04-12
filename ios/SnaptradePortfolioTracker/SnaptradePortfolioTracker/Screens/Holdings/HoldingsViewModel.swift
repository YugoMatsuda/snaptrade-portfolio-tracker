import Foundation
import Observation

@MainActor
@Observable
final class HoldingsViewModel {
    enum State {
        case idle
        case loading
        case loaded(Holdings)
        case error(String)
    }

    var state: State = .idle

    private let accountId: String
    private let service: HoldingsAPIGateway

    init(service: HoldingsAPIGateway, accountId: String) {
        self.service = service
        self.accountId = accountId
    }

    func fetchHoldings() async {
        state = .loading
        do {
            let holdings = try await service.fetchHoldings(accountId: accountId)
            state = .loaded(holdings)
        } catch {
            state = .error(error.localizedDescription)
        }
    }
}
