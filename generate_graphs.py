import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import cross_val_predict
from pathlib import Path

# Paths
DATA_FILE = Path("backend/data/risk_history.jsonl")
ARTIFACTS_DIR = Path("/Users/nandhu/.gemini/antigravity/brain/96cf7ebf-60f9-44d0-8369-3fc682ce6eb7")

def load_data():
    records = []
    if not DATA_FILE.exists():
        print(f"Data file not found: {DATA_FILE}")
        return pd.DataFrame()
        
    with open(DATA_FILE, "r") as f:
        for line in f:
            if line.strip():
                records.append(json.loads(line))
    return pd.DataFrame(records)

def generate_plots():
    df = load_data()
    if df.empty:
        print("No data available to plot.")
        return

    # Use a clean, report-friendly style (white background)
    plt.style.use('default')
    sns.set_theme(style="whitegrid")

    # Features to analyze
    features = [
        "news_severity", "weather_severity", "port_severity", 
        "vessel_count", "wind_speed_kmh", "moored_count", "stationary_count"
    ]
    
    # Clean data (fill NAs)
    df = df.fillna(0)
    
    # Ensure features exist
    for f in features:
        if f not in df.columns:
            df[f] = 0

    X = df[features]
    y_delay = df["avg_delay_hours"]
    
    # 1. Feature Importance (Random Forest)
    rf = RandomForestRegressor(n_estimators=100, random_state=42)
    rf.fit(X, y_delay)
    
    importances = pd.Series(rf.feature_importances_ * 100, index=features).sort_values(ascending=True)
    
    fig, ax = plt.subplots(figsize=(10, 6), facecolor='white')
    bars = importances.plot(kind='barh', color='#2b8cbe', ax=ax)
    plt.title("ML Feature Importance: Drivers of Port Delay", fontsize=16, fontweight='bold', pad=15)
    plt.xlabel("Relative Importance (%)", fontsize=12, fontweight='bold')
    plt.ylabel("Features", fontsize=12, fontweight='bold')
    plt.xticks(fontsize=11)
    plt.yticks(fontsize=11)
    
    # Add values to the bars
    for i, v in enumerate(importances):
        ax.text(v + 0.5, i, f"{v:.1f}%", color='black', va='center', fontweight='bold')
        
    plt.tight_layout()
    plt.savefig(ARTIFACTS_DIR / "feature_importance.png", dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    
    # 2. Correlation Heatmap
    fig, ax = plt.subplots(figsize=(10, 8), facecolor='white')
    corr_matrix = df[features + ["avg_delay_hours", "heuristic_risk_score"]].corr()
    
    # Clean up labels for display
    display_labels = [f.replace("_", " ").title() for f in corr_matrix.columns]
    
    sns.heatmap(corr_matrix, annot=True, cmap="vlag", fmt=".2f", vmin=-1, vmax=1, 
                xticklabels=display_labels, yticklabels=display_labels,
                cbar_kws={'label': 'Correlation Coefficient'}, ax=ax)
    plt.title("Cross-Factor Correlation Matrix", fontsize=16, fontweight='bold', pad=15)
    plt.xticks(rotation=45, ha='right', fontsize=11)
    plt.yticks(rotation=0, fontsize=11)
    plt.tight_layout()
    plt.savefig(ARTIFACTS_DIR / "correlation_heatmap.png", dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    
    # 3. Actual vs Predicted Delays (Scatter Plot)
    y_pred = cross_val_predict(rf, X, y_delay, cv=5)
    
    fig, ax = plt.subplots(figsize=(8, 6), facecolor='white')
    plt.scatter(y_delay, y_pred, alpha=0.7, color='#2ca25f', s=60, edgecolor='black', linewidth=0.5)
    
    # Plot perfect prediction line
    max_val = max(y_delay.max(), y_pred.max())
    plt.plot([0, max_val], [0, max_val], 'r--', lw=2, label='Perfect Prediction')
    
    plt.title("Delay Estimator: Actual vs. Predicted Delays", fontsize=16, fontweight='bold', pad=15)
    plt.xlabel("Actual Average Delay (Hours)", fontsize=12, fontweight='bold')
    plt.ylabel("Predicted Average Delay (Hours)", fontsize=12, fontweight='bold')
    plt.xticks(fontsize=11)
    plt.yticks(fontsize=11)
    plt.legend(fontsize=11)
    plt.grid(True, linestyle='--', alpha=0.7)
    plt.tight_layout()
    plt.savefig(ARTIFACTS_DIR / "actual_vs_predicted.png", dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()

    print("Graphs generated successfully in artifacts directory.")

if __name__ == "__main__":
    generate_plots()
