//
//  ContentView.swift
//  SnaptradePortfolioTracker
//
//  Created by Yugo Matsuda on 2026-04-06.
//

import OpenAPIRuntime
import OpenAPIURLSession
import SwiftUI

@MainActor
@Observable
final class HoldingsViewModel {
    var positions: [Operations.holdings_period_getAll.Output.Ok.Body.jsonPayload.positionsPayloadPayload] = []
    var totalValue: Double?
    var currency: String?
    var isLoading = false
    var errorMessage: String?

    private let client = Client(
        serverURL: URL(string: "http://localhost:8000/api")!,
        transport: URLSessionTransport()
    )

    // TODO: Phase 4でSupabase AuthのJWTに置き換える
    // Phase 4実装までの仮置き（Supabase DBからuserSecretを取得する形に移行する）
    private let userId = ""
    private let userSecret = ""
    private let accountId = ""

    func fetchHoldings() async {
        isLoading = true
        errorMessage = nil
        do {
            let response = try await client.holdings_period_getAll(.init(
                body: .json(.init(
                    userId: userId,
                    userSecret: userSecret,
                    accountId: accountId
                ))
            ))
            switch response {
            case .ok(let ok):
                let body = try ok.body.json
                positions = body.positions
                totalValue = body.total_value
                currency = body.currency
            case .undocumented(let statusCode, _):
                errorMessage = "Unexpected status: \(statusCode)"
            }
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}

struct ContentView: View {
    @State private var viewModel = HoldingsViewModel()

    var body: some View {
        NavigationStack {
            bodyContent
                .navigationTitle("Portfolio")
                .toolbar {
                    if let total = viewModel.totalValue, let currency = viewModel.currency {
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
        if viewModel.isLoading {
            ProgressView("Loading...")
        } else if let error = viewModel.errorMessage {
            Text("Error: \(error)").foregroundStyle(.red)
        } else {
            List {
                ForEach(Array(viewModel.positions.enumerated()), id: \.offset) { _, position in
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

#Preview {
    ContentView()
}
