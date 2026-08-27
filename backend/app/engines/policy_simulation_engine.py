from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class PolicyScenarioRequest(BaseModel):
    scenario_title: str = Field(..., min_length=3, max_length=120)
    policy_type: str = Field(..., description="FREIGHT_SUBSIDY, PRICE_CAP_STABILIZATION, STORAGE_SUBSIDY, BUFFER_STOCK_RELEASE, DIRECT_PROCUREMENT_MSP")
    target_commodity: str
    target_region: str
    intervention_magnitude_pct: float = Field(default=25.0, ge=1.0, le=100.0, description="% subsidy or magnitude")
    estimated_regional_volume_tonnes: float = Field(default=5000.0, gt=0)
    baseline_retail_price_per_kg: float = Field(default=35.0, gt=0)
    baseline_farmer_price_per_kg: float = Field(default=22.0, gt=0)

class PolicyScenarioResult(BaseModel):
    scenario_title: str
    policy_type: str
    target_commodity: str
    target_region: str
    farmer_earnings_uplift_total_inr: float
    consumer_savings_total_inr: float
    total_government_fiscal_outlay_inr: float
    benefit_cost_ratio: float
    projected_new_farmer_price_per_kg: float
    projected_new_retail_price_per_kg: float
    market_distortion_risk: str # LOW, MODERATE, HIGH
    tradeoff_analysis: List[str]
    implementation_recommendation: str

class PolicySimulationEngine:
    """
    Department of Consumer Affairs (DoCA) Macroeconomic Policy What-If Scenario Simulator.
    """

    @classmethod
    def simulate_policy_intervention(cls, req: PolicyScenarioRequest) -> PolicyScenarioResult:
        Q_kg = req.estimated_regional_volume_tonnes * 1000.0
        P_farmer = req.baseline_farmer_price_per_kg
        P_retail = req.baseline_retail_price_per_kg
        mag = req.intervention_magnitude_pct

        if req.policy_type == "FREIGHT_SUBSIDY":
            # Subsidy on freight (e.g. 30% transport rebate)
            # Increases farmer net realization without raising consumer price
            freight_base_per_kg = 2.5
            subsidy_per_kg = freight_base_per_kg * (mag / 100.0)
            fiscal_outlay = subsidy_per_kg * Q_kg
            farmer_uplift = subsidy_per_kg * 0.85 * Q_kg # 85% passes through to farmer payout
            consumer_savings = subsidy_per_kg * 0.15 * Q_kg # 15% passes to consumer
            new_p_farmer = round(P_farmer + (subsidy_per_kg * 0.85), 2)
            new_p_retail = round(P_retail - (subsidy_per_kg * 0.15), 2)
            distortion_risk = "LOW"
            tradeoffs = [
                f"Directly lowers inter-state transport frictions for {req.target_commodity} from {req.target_region}.",
                "Stimulates long-distance produce movement into deficit metropolitan terminal markets.",
                f"Requires fiscal outlay of ₹{fiscal_outlay:,.2f} over the intervention period."
            ]
            recommendation = "HIGHLY RECOMMENDED: Yields high market efficiency with zero production disincentives."

        elif req.policy_type == "BUFFER_STOCK_RELEASE":
            # Release state reserves into urban wholesale mandis to cool prices
            release_qty_kg = Q_kg * (mag / 100.0)
            # Price drop elasticity
            price_drop_pct = min(35.0, (mag * 0.75))
            new_p_retail = round(P_retail * (1.0 - price_drop_pct / 100.0), 2)
            new_p_farmer = round(P_farmer * (1.0 - (price_drop_pct * 0.4) / 100.0), 2) # Partially buffers farmgate
            consumer_savings = (P_retail - new_p_retail) * Q_kg
            farmer_uplift = 0.0 # Farmers don't gain directly from state releases
            fiscal_outlay = release_qty_kg * 3.5 # Handling and open-market distribution fee
            distortion_risk = "MODERATE"
            tradeoffs = [
                f"Rapidly cools urban retail price strain by {price_drop_pct}% in {req.target_region}.",
                "May temporarily soften spot farmgate prices if release timing is not carefully staggered.",
                f"Generates massive consumer welfare savings of ₹{consumer_savings:,.2f}."
            ]
            recommendation = "RECOMMENDED WITH STAGGERING: Release in targeted metropolitan consumer zones only."

        elif req.policy_type == "STORAGE_SUBSIDY":
            # Cold storage power / rental subsidy during peak harvest gluts
            subsidy_per_kg = 0.08 * (mag / 100.0) * 30.0 # 30-day storage assistance
            fiscal_outlay = subsidy_per_kg * Q_kg
            # Prevents distress selling: saves ₹3.50/kg in dumpage/distress loss
            farmer_uplift = (3.50 + subsidy_per_kg) * Q_kg
            consumer_savings = 0.50 * Q_kg
            new_p_farmer = round(P_farmer + 3.50, 2)
            new_p_retail = P_retail
            distortion_risk = "LOW"
            tradeoffs = [
                f"Eliminates distress dumping of perishable {req.target_commodity} during harvest peak.",
                "Smooths out 60-day regional market supply curve.",
                "Extremely cost-effective fiscal leverage (Benefit-to-Cost > 3.0)."
            ]
            recommendation = "STRONGLY ENDORSED: Best intervention for perishable horticultural crops."

        else: # PRICE_CAP_STABILIZATION or MSP
            subsidy_per_kg = P_farmer * (mag / 100.0) * 0.5
            fiscal_outlay = subsidy_per_kg * Q_kg
            farmer_uplift = subsidy_per_kg * Q_kg
            consumer_savings = (P_retail * 0.1) * Q_kg
            new_p_farmer = round(P_farmer + subsidy_per_kg, 2)
            new_p_retail = round(P_retail * 0.95, 2)
            distortion_risk = "HIGH"
            tradeoffs = [
                "Guarantees firm floor price to producers.",
                "High administrative monitoring overhead; risk of secondary market arbitrage."
            ]
            recommendation = "CONDITIONAL: Deploy only if open market price collapses below baseline production cost."

        total_benefit = farmer_uplift + consumer_savings
        bcr = round(total_benefit / fiscal_outlay, 2) if fiscal_outlay > 0 else 5.0

        return PolicyScenarioResult(
            scenario_title=req.scenario_title,
            policy_type=req.policy_type,
            target_commodity=req.target_commodity,
            target_region=req.target_region,
            farmer_earnings_uplift_total_inr=round(farmer_uplift, 2),
            consumer_savings_total_inr=round(consumer_savings, 2),
            total_government_fiscal_outlay_inr=round(fiscal_outlay, 2),
            benefit_cost_ratio=bcr,
            projected_new_farmer_price_per_kg=new_p_farmer,
            projected_new_retail_price_per_kg=new_p_retail,
            market_distortion_risk=distortion_risk,
            tradeoff_analysis=tradeoffs,
            implementation_recommendation=recommendation
        )
