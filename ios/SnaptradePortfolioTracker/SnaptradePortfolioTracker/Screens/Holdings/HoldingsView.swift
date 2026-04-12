import SwiftUI

struct HoldingsView: View {
    @State private var viewModel: HoldingsViewModel

    init(viewModel: HoldingsViewModel) {
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        NavigationStack {
            bodyContent
                .navigationTitle("Portfolio")
                .toolbar {
                    if case .loaded(_, let totalValue, let currency) = viewModel.state,
                       let total = totalValue, let currency {
                        ToolbarItem(placement: .topBarTrailing) {
                            Text("\(currency) \(total, specifier: "%.2f")")
                                .font(.subheadline)
                                .bold()
                        }
                    }
                }
                .task {
                    await viewModel.fetchHoldings()
                }
        }
    }

    @ViewBuilder
    private var bodyContent: some View {
        switch viewModel.state {
        case .idle, .loading:
            ProgressView("Loading...")
        case .error(let message):
            Text("Error: \(message)").foregroundStyle(.red)
        case .loaded(let positions, _, _):
            List {
                ForEach(Array(positions.enumerated()), id: \.offset) { _, position in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(position.symbol?.symbol?.symbol ?? "-")
                            .font(.headline)
                        HStack {
                            Text("Units: \(position.units ?? 0, specifier: "%.2f")")
                            Spacer()
                            Text("$\(position.price ?? 0, specifier: "%.2f")")
                        }
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }
}
