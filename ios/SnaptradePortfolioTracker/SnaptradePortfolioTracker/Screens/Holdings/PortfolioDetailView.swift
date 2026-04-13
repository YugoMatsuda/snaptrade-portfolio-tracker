import SwiftUI

struct PortfolioDetailView: View {
    @State private var viewModel: PortfolioDetailViewModel

    init(viewModel: PortfolioDetailViewModel) {
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        bodyContent
            .navigationTitle("Portfolio")
            .toolbar {
                if case .loaded(let holdings) = viewModel.state {
                    ToolbarItem(placement: .topBarTrailing) {
                        Text("\(holdings.currency) \(holdings.totalValue, specifier: "%.2f")")
                            .font(.subheadline)
                            .bold()
                    }
                }
            }
            .task {
                await viewModel.fetchHoldings()
            }
    }

    @ViewBuilder
    private var bodyContent: some View {
        switch viewModel.state {
        case .idle, .loading:
            ProgressView("Loading...")
        case .error(let message):
            Text("Error: \(message)").foregroundStyle(.red)
        case .loaded(let holdings):
            List {
                if !holdings.balances.isEmpty {
                    Section("Cash") {
                        ForEach(holdings.balances, id: \.currency) { balance in
                            HStack {
                                Text(balance.currency)
                                    .font(.headline)
                                Spacer()
                                Text("\(balance.cash, specifier: "%.2f")")
                                    .font(.subheadline)
                            }
                        }
                    }
                }
                Section("Positions") {
                    ForEach(holdings.positions, id: \.ticker) { position in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(position.ticker)
                                .font(.headline)
                            HStack {
                                Text("Units: \(position.units, specifier: "%.2f")")
                                Spacer()
                                Text("$\(position.price, specifier: "%.2f")")
                            }
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
    }
}
