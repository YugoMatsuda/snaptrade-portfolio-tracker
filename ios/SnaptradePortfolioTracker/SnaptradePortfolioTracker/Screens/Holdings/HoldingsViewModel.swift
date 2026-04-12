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

    // TODO: Phase 5bでaccountId選択UIを実装する
    private let accountId = ""
    private let service: HoldingsAPIGateway

    init(service: HoldingsAPIGateway) {
        self.service = service
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
