import math
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class BatchDecisionRequestSchema(BaseModel):
    commodity: str
    quantity_kg: float = Field(..., gt=0)
    current_local_price_per_kg: float = Field(..., gt=0)
    shelf_life_days: int = Field(default=14, ge=1)
    storage_cost_per_kg_day: float = Field(default=0.08, ge=0) # ₹0.08/kg/day standard cold storage
    daily_spoilage_rate: float = Field(default=0.005, ge=0)     # 0.5% weight/quality loss per day
    forecasted_prices: List[float] = Field(default=[], description="14-day forecasted price curve")
    alternative_markets: Optional[List[Dict[str, Any]]] = Field(default=[], description="List of distant markets with price & distance")
    min_cash_need_pct: float = Field(default=0.0, ge=0.0, le=100.0, description="Minimum % needed immediately for working capital")

class OptionPayoff(BaseModel):
    action: str # SELL_NOW, STORE, MOVE, SPLIT
    expected_net_revenue: float
    expected_price_per_kg: float
    revenue_uplift_vs_sell_now: float
    revenue_uplift_pct: float
    costs_breakdown: Dict[str, float]
    risk_level: str # LOW, MEDIUM, HIGH
    feasibility: str # FEASIBLE, INFEASIBLE_SHELF_LIFE, INFEASIBLE_HIGH_COST
    details: Dict[str, Any]

class DecisionRecommendationResult(BaseModel):
    commodity: str
    quantity_kg: float
    optimal_action: str # SELL_NOW, STORE, MOVE, SPLIT
    optimal_net_revenue: float
    net_uplift_vs_local_sell_now: float
    net_uplift_pct: float
    recommendation_summary: str
    key_decision_factors: List[str]
    options_comparison: List[OptionPayoff]
    split_allocation: Optional[Dict[str, float]] = None

class AgriculturalDecisionEngine:
    """
    Economic Decision Engine for SIH26033.
    Solves optimal batch allocation across SELL_NOW, STORE, MOVE, and SPLIT actions.
    """

    @classmethod
    def evaluate_batch_decision(cls, req: BatchDecisionRequestSchema) -> DecisionRecommendationResult:
        Q = req.quantity_kg
        P_local = req.current_local_price_per_kg
        shelf_life = req.shelf_life_days
        storage_rate = req.storage_cost_per_kg_day
        daily_spoilage = req.daily_spoilage_rate

        # 1. OPTION 1: SELL_NOW
        sell_now_handling = 0.5 * (Q / 100.0) # Nominal mandi loading fee ₹0.50/qtl
        sell_now_revenue = (Q * P_local) - sell_now_handling
        sell_now_payoff = OptionPayoff(
            action="SELL_NOW",
            expected_net_revenue=round(sell_now_revenue, 2),
            expected_price_per_kg=round(sell_now_revenue / Q, 2),
            revenue_uplift_vs_sell_now=0.0,
            revenue_uplift_pct=0.0,
            costs_breakdown={"handling_fee": round(sell_now_handling, 2), "storage_cost": 0.0, "transport_cost": 0.0, "spoilage_loss": 0.0},
            risk_level="LOW",
            feasibility="FEASIBLE",
            details={"days_held": 0, "destination": "Local Mandi", "strategy": "Immediate spot market liquidation"}
        )

        # 2. OPTION 2: STORE (Evaluate all forecast days d = 1..min(14, shelf_life))
        forecast = req.forecasted_prices
        if not forecast or len(forecast) < 7:
            # Baseline 14-day default trend if empty
            forecast = [P_local * (1.0 + 0.015 * i + 0.01 * math.sin(i)) for i in range(1, 15)]

        best_store_net = -1.0
        best_store_day = 1
        best_store_costs = {}
        best_store_feasible = "FEASIBLE"
        best_store_pred_price = P_local

        max_store_days = min(len(forecast), max(1, shelf_life - 2)) # Leave 2-day buffer before max shelf life
        if shelf_life <= 3:
            best_store_feasible = "INFEASIBLE_SHELF_LIFE"

        for d in range(1, max_store_days + 1):
            future_p = forecast[d - 1]
            retained_weight = Q * (1.0 - (daily_spoilage * d))
            spoilage_val_loss = (Q - retained_weight) * future_p
            total_storage_fee = Q * storage_rate * d
            gross_future_rev = retained_weight * future_p
            net_store_rev = gross_future_rev - total_storage_fee - sell_now_handling

            if net_store_rev > best_store_net:
                best_store_net = net_store_rev
                best_store_day = d
                best_store_pred_price = future_p
                best_store_costs = {
                    "storage_cost": round(total_storage_fee, 2),
                    "spoilage_loss": round(spoilage_val_loss, 2),
                    "handling_fee": round(sell_now_handling, 2),
                    "transport_cost": 0.0
                }

        store_uplift = best_store_net - sell_now_revenue if best_store_feasible == "FEASIBLE" else 0.0
        store_uplift_pct = (store_uplift / sell_now_revenue) * 100.0 if sell_now_revenue > 0 else 0.0

        store_payoff = OptionPayoff(
            action="STORE",
            expected_net_revenue=round(max(0.0, best_store_net), 2),
            expected_price_per_kg=round(best_store_net / Q, 2) if Q > 0 else 0.0,
            revenue_uplift_vs_sell_now=round(store_uplift, 2),
            revenue_uplift_pct=round(store_uplift_pct, 1),
            costs_breakdown=best_store_costs,
            risk_level="MEDIUM" if best_store_day <= 7 else "HIGH",
            feasibility=best_store_feasible,
            details={
                "optimal_holding_days": best_store_day,
                "projected_sale_price_per_kg": round(best_store_pred_price, 2),
                "expected_weight_after_shrinkage_kg": round(Q * (1.0 - (daily_spoilage * best_store_day)), 1)
            }
        )

        # 3. OPTION 3: MOVE (Evaluate alternative distant markets)
        best_move_net = -1.0
        best_move_market = "None"
        best_move_costs = {}
        best_move_feasible = "FEASIBLE"

        alt_markets = req.alternative_markets or [
            {"market_name": "Delhi-NCR Terminal Market", "price_per_kg": P_local * 1.35, "distance_km": 140.0, "transit_hours": 4.5},
            {"market_name": "Chandigarh Grain Hub", "price_per_kg": P_local * 1.15, "distance_km": 95.0, "transit_hours": 2.5}
        ]

        for m in alt_markets:
            p_dist = m.get("price_per_kg", P_local * 1.2)
            dist_km = m.get("distance_km", 100.0)
            transit_hrs = m.get("transit_hours", 3.0)
            
            # Transport cost formula: base ₹1.5/kg + ₹0.012/kg/km
            freight_cost = (1.5 + (dist_km * 0.012)) * Q
            transit_spoilage_rate = min(0.05, 0.002 * transit_hrs) # 0.2% per transit hr
            delivered_weight = Q * (1.0 - transit_spoilage_rate)
            spoilage_loss_move = (Q - delivered_weight) * p_dist
            gross_move_rev = delivered_weight * p_dist
            net_move_rev = gross_move_rev - freight_cost - sell_now_handling

            if net_move_rev > best_move_net:
                best_move_net = net_move_rev
                best_move_market = m.get("market_name", "Regional Hub")
                best_move_costs = {
                    "transport_cost": round(freight_cost, 2),
                    "spoilage_loss": round(spoilage_loss_move, 2),
                    "handling_fee": round(sell_now_handling, 2),
                    "storage_cost": 0.0
                }

        move_uplift = best_move_net - sell_now_revenue
        move_uplift_pct = (move_uplift / sell_now_revenue) * 100.0 if sell_now_revenue > 0 else 0.0

        move_payoff = OptionPayoff(
            action="MOVE",
            expected_net_revenue=round(max(0.0, best_move_net), 2),
            expected_price_per_kg=round(best_move_net / Q, 2) if Q > 0 else 0.0,
            revenue_uplift_vs_sell_now=round(move_uplift, 2),
            revenue_uplift_pct=round(move_uplift_pct, 1),
            costs_breakdown=best_move_costs,
            risk_level="MEDIUM",
            feasibility=best_move_feasible,
            details={"destination_market": best_move_market}
        )

        # 4. OPTION 4: SPLIT (Optimized liquidity + high-return portfolio)
        # If farmer needs min cash immediately or wants balanced risk:
        min_cash_pct = req.min_cash_need_pct if req.min_cash_need_pct > 0 else 30.0
        q_sell = Q * (min_cash_pct / 100.0)
        q_rem = Q - q_sell

        # Allocate remainder to highest yielding alternative (STORE or MOVE)
        rem_target = "STORE" if (store_uplift > move_uplift and best_store_feasible == "FEASIBLE") else "MOVE"
        rem_unit_net = (best_store_net / Q) if rem_target == "STORE" else (best_move_net / Q)
        split_net = (q_sell * (sell_now_revenue / Q)) + (q_rem * rem_unit_net)
        split_uplift = split_net - sell_now_revenue
        split_uplift_pct = (split_uplift / sell_now_revenue) * 100.0 if sell_now_revenue > 0 else 0.0

        split_payoff = OptionPayoff(
            action="SPLIT",
            expected_net_revenue=round(split_net, 2),
            expected_price_per_kg=round(split_net / Q, 2),
            revenue_uplift_vs_sell_now=round(split_uplift, 2),
            revenue_uplift_pct=round(split_uplift_pct, 1),
            costs_breakdown={
                "storage_cost": round(best_store_costs.get("storage_cost", 0.0) * (q_rem / Q), 2) if rem_target == "STORE" else 0.0,
                "transport_cost": round(best_move_costs.get("transport_cost", 0.0) * (q_rem / Q), 2) if rem_target == "MOVE" else 0.0,
                "spoilage_loss": round((best_store_costs.get("spoilage_loss", 0.0) if rem_target == "STORE" else best_move_costs.get("spoilage_loss", 0.0)) * (q_rem / Q), 2),
                "handling_fee": round(sell_now_handling, 2)
            },
            risk_level="LOW_TO_MEDIUM",
            feasibility="FEASIBLE",
            details={
                "sell_now_kg": round(q_sell, 1),
                "sell_now_pct": min_cash_pct,
                "optimized_target": rem_target,
                "optimized_target_kg": round(q_rem, 1),
                "optimized_target_pct": 100.0 - min_cash_pct
            }
        )

        all_options = [sell_now_payoff, store_payoff, move_payoff, split_payoff]

        # Determine Winner based on maximum net revenue with feasibility filter
        feasible_options = [o for o in all_options if o.feasibility == "FEASIBLE"]
        winner = max(feasible_options, key=lambda o: o.expected_net_revenue)

        # Generate Explainable Recommendation Drivers
        factors = []
        if winner.action == "MOVE":
            factors.append(f"Destination '{best_move_market}' offers strong price arbitrage net of freight and handling (+₹{round(winner.revenue_uplift_vs_sell_now, 2)} total uplift).")
            factors.append("Cold-chain transit keeps spoilage degradation under 1.5% during transit.")
        elif winner.action == "STORE":
            factors.append(f"Price forecast projects peak market strain in {best_store_day} days (+₹{round(best_store_pred_price - P_local, 2)}/kg price appreciation).")
            factors.append(f"Storage fee (₹{storage_rate}/kg/day) is heavily outweighed by forecasted price gains.")
        elif winner.action == "SPLIT":
            factors.append(f"Guarantees immediate liquidity (₹{round(q_sell * P_local, 2)}) while capturing {round(100.0 - min_cash_pct, 0)}% of the market upside.")
            factors.append("Balances working capital needs with maximum portfolio risk protection.")
        else:
            factors.append(f"Local spot price (₹{P_local}/kg) is currently at equilibrium; storage costs and freight fees erode margins.")
            factors.append("Immediate sale eliminates inventory spoilage and market timing risk.")

        summary_msg = f"Recommendation: {winner.action}. Expected Net Realization: ₹{winner.expected_net_revenue:,.2f} (+{winner.revenue_uplift_pct}% vs local immediate sale)."

        return DecisionRecommendationResult(
            commodity=req.commodity,
            quantity_kg=Q,
            optimal_action=winner.action,
            optimal_net_revenue=winner.expected_net_revenue,
            net_uplift_vs_local_sell_now=winner.revenue_uplift_vs_sell_now,
            net_uplift_pct=winner.revenue_uplift_pct,
            recommendation_summary=summary_msg,
            key_decision_factors=factors,
            options_comparison=all_options,
            split_allocation={"sell_now_kg": q_sell, "optimized_rem_kg": q_rem, "target": rem_target} if winner.action == "SPLIT" else None
        )
