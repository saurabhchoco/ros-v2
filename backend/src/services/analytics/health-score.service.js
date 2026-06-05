class HealthScoreService {
  calculate(summary, outletPerformance) {
    const weights = {
      revenueGrowth: 0.30,
      orderGrowth: 0.25,
      completionRate: 0.25,
      aovGrowth: 0.20,
    };

    let revenueScore = 50;
    if (summary.revenue_growth_pct > 0) {
      revenueScore = Math.min(100, 50 + summary.revenue_growth_pct * 2);
    } else if (summary.revenue_growth_pct < 0) {
      revenueScore = Math.max(0, 50 + summary.revenue_growth_pct * 2);
    }

    let orderScore = 50;
    if (summary.orders_growth_pct > 0) {
      orderScore = Math.min(100, 50 + summary.orders_growth_pct * 2);
    } else if (summary.orders_growth_pct < 0) {
      orderScore = Math.max(0, 50 + summary.orders_growth_pct * 2);
    }

    let avgCompletion = 0;
    const outletsWithOrders = outletPerformance.filter(o => o.orders > 0);
    if (outletsWithOrders.length > 0) {
      const total = outletsWithOrders.reduce((sum, o) => sum + (o.completion_rate_pct || 0), 0);
      avgCompletion = total / outletsWithOrders.length;
    }
    const completionScore = avgCompletion;

    let aovScore = 50;
    if (summary.aov_growth_pct > 0) {
      aovScore = Math.min(100, 50 + summary.aov_growth_pct * 2);
    } else if (summary.aov_growth_pct < 0) {
      aovScore = Math.max(0, 50 + summary.aov_growth_pct * 2);
    }

    const totalScore =
      revenueScore * weights.revenueGrowth +
      orderScore * weights.orderGrowth +
      completionScore * weights.completionRate +
      aovScore * weights.aovGrowth;

    let status = 'Moderate';
    if (totalScore >= 80) status = 'Strong';
    else if (totalScore <= 40) status = 'At Risk';

    return {
      score: Math.round(totalScore),
      status,
      components: {
        revenueGrowth: { score: Math.round(revenueScore), weight: weights.revenueGrowth },
        orderGrowth: { score: Math.round(orderScore), weight: weights.orderGrowth },
        completionRate: { score: Math.round(completionScore), weight: weights.completionRate },
        aovGrowth: { score: Math.round(aovScore), weight: weights.aovGrowth },
      },
    };
  }
}

module.exports = new HealthScoreService();