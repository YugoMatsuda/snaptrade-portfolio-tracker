import Foundation
import Observation
import OpenAPIRuntime

@MainActor
@Observable
final class HoldingsViewModel {
    enum State {
        case idle
        case loading
        case loaded(positions: [Operations.holdings_period_getAll.Output.Ok.Body.jsonPayload.positionsPayloadPayload], totalValue: Double?, currency: String?)
        case error(String)
    }

    var state: State = .idle

    // TODO: Phase 5bでaccountId選択UIを実装する
    private let accountId = ""
    private let client: Client

    init(client: Client) {
        self.client = client
    }

    func fetchHoldings() async {
        state = .loading
        do {
            let response = try await client.holdings_period_getAll(.init(
                body: .json(.init(accountId: accountId))
            ))
            switch response {
            case .ok(let ok):
                let body = try ok.body.json
                state = .loaded(
                    positions: body.positions,
                    totalValue: body.total_value,
                    currency: body.currency
                )
            case .undocumented(let statusCode, _):
                state = .error("Unexpected status: \(statusCode)")
            }
        } catch {
            state = .error(error.localizedDescription)
        }
    }
}
