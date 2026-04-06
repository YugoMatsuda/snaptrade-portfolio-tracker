import { os } from "@orpc/server";
import { GetHoldingsOutput } from "../../contract/holdings.ts";

export const holdingsGetAll = os
  .output(GetHoldingsOutput)
  .handler(() => {
    return {
      positions: [
        {
          symbol: { ticker: "AAPL", name: "Apple Inc." },
          units: 10,
          price: 189.5,
          open_pnl: 145.0,
          average_purchase_price: 175.0,
        },
        {
          symbol: { ticker: "GOOGL", name: "Alphabet Inc." },
          units: 5,
          price: 141.8,
          open_pnl: -23.5,
          average_purchase_price: 146.5,
        },
      ],
      balances: [
        {
          currency: { code: "USD" },
          cash: 1500.0,
          buying_power: 1500.0,
        },
      ],
      total_value: 3591.5,
      currency: "USD",
    };
  });
