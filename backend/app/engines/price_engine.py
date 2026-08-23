from typing import Dict, Any

class FairPriceEngine:
    """
    Direct Fair Price & Disintermediation Engine for SIH26033.
    Evaluates price margins, farmer payouts, logistics allocation, and consumer savings.
    """

    @staticmethod
    def calculate_price_breakdown(
        farmer_target_price_per_kg: float,
        quantity_kg: float,
        distance_km: float,
        middleman_baseline_price_per_kg: float,
        consumer_benchmark_retail_price_per_kg: float
    ) -> Dict[str, Any]:
        """
        Calculates direct fair pricing vs traditional 3-tier middleman supply chain.
        """
        # Logistics cost model: Base handling fee + distance rate per kg
        logistics_rate_per_kg_km = 0.012  # Rs 0.012 per kg per km
        base_logistics_per_kg = 1.5       # Rs 1.5 base handling & cold packaging
        logistics_cost_per_kg = base_logistics_per_kg + (distance_km * logistics_rate_per_kg_km)
        
        # Platform quality check & escrow fee (1.5%)
        platform_fee_per_kg = farmer_target_price_per_kg * 0.015
        
        # Total Direct Cost to Consumer / Bulk Buyer
        direct_consumer_price_per_kg = farmer_target_price_per_kg + logistics_cost_per_kg + platform_fee_per_kg
        
        # Financial Totals
        total_farmer_payout_direct = farmer_target_price_per_kg * quantity_kg
        total_farmer_payout_middleman = middleman_baseline_price_per_kg * quantity_kg
        farmer_earnings_uplift_amount = total_farmer_payout_direct - total_farmer_payout_middleman
        farmer_earnings_uplift_percent = (
            (farmer_earnings_uplift_amount / total_farmer_payout_middleman) * 100.0
            if total_farmer_payout_middleman > 0 else 0.0
        )

        total_consumer_cost_direct = direct_consumer_price_per_kg * quantity_kg
        total_consumer_cost_retail = consumer_benchmark_retail_price_per_kg * quantity_kg
        consumer_savings_amount = total_consumer_cost_retail - total_consumer_cost_direct
        consumer_savings_percent = (
            (consumer_savings_amount / total_consumer_cost_retail) * 100.0
            if total_consumer_cost_retail > 0 else 0.0
        )

        # Middleman Margin Elimination Analysis
        eliminated_middleman_margin_per_kg = consumer_benchmark_retail_price_per_kg - middleman_baseline_price_per_kg - logistics_cost_per_kg

        return {
            "farmer_price_per_kg": round(farmer_target_price_per_kg, 2),
            "logistics_cost_per_kg": round(logistics_cost_per_kg, 2),
            "platform_fee_per_kg": round(platform_fee_per_kg, 2),
            "direct_consumer_price_per_kg": round(direct_consumer_price_per_kg, 2),
            "middleman_baseline_price_per_kg": round(middleman_baseline_price_per_kg, 2),
            "consumer_benchmark_retail_price_per_kg": round(consumer_benchmark_retail_price_per_kg, 2),
            
            "total_farmer_payout_direct": round(total_farmer_payout_direct, 2),
            "total_farmer_payout_middleman": round(total_farmer_payout_middleman, 2),
            "farmer_earnings_uplift_amount": round(farmer_earnings_uplift_amount, 2),
            "farmer_earnings_uplift_percent": round(farmer_earnings_uplift_percent, 1),
            
            "total_consumer_cost_direct": round(total_consumer_cost_direct, 2),
            "total_consumer_cost_retail": round(total_consumer_cost_retail, 2),
            "consumer_savings_amount": round(consumer_savings_amount, 2),
            "consumer_savings_percent": round(consumer_savings_percent, 1),
            
            "eliminated_middleman_margin_per_kg": round(eliminated_middleman_margin_per_kg, 2),
            "disintermediation_efficiency_score": min(100.0, round(farmer_earnings_uplift_percent + consumer_savings_percent, 1))
        }
