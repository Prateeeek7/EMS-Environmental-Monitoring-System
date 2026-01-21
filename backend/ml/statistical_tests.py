"""
Statistical Tests Module
Implements t-tests, ANOVA, regression, and distribution analysis
"""

import numpy as np
import pandas as pd
from scipy import stats
from scipy.stats import f_oneway
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.metrics import r2_score
import warnings
warnings.filterwarnings('ignore')

def t_test(data1, data2):
    """Perform independent samples t-test"""
    try:
        t_stat, p_value = stats.ttest_ind(data1, data2)
        mean1 = np.mean(data1)
        mean2 = np.mean(data2)
        std1 = np.std(data1, ddof=1)
        std2 = np.std(data2, ddof=1)
        
        return {
            't_statistic': float(t_stat),
            'p_value': float(p_value),
            'mean1': float(mean1),
            'mean2': float(mean2),
            'std1': float(std1),
            'std2': float(std2),
            'significant': p_value < 0.05,
            'interpretation': 'Significantly different' if p_value < 0.05 else 'Not significantly different'
        }
    except Exception as e:
        raise ValueError(f"Error in t-test: {str(e)}")

def anova_test(groups):
    """Perform one-way ANOVA test"""
    try:
        if len(groups) < 2:
            raise ValueError("ANOVA requires at least 2 groups")
        
        f_stat, p_value = f_oneway(*groups)
        means = [np.mean(group) for group in groups]
        stds = [np.std(group, ddof=1) for group in groups]
        
        return {
            'f_statistic': float(f_stat),
            'p_value': float(p_value),
            'means': [float(m) for m in means],
            'stds': [float(s) for s in stds],
            'significant': p_value < 0.05,
            'interpretation': 'Significantly different' if p_value < 0.05 else 'Not significantly different'
        }
    except Exception as e:
        raise ValueError(f"Error in ANOVA: {str(e)}")

def linear_regression(x, y):
    """Perform linear regression analysis"""
    try:
        x = np.array(x).reshape(-1, 1)
        y = np.array(y)
        
        model = LinearRegression()
        model.fit(x, y)
        
        y_pred = model.predict(x)
        r2 = r2_score(y, y_pred)
        
        return {
            'slope': float(model.coef_[0]),
            'intercept': float(model.intercept_),
            'r_squared': float(r2),
            'predictions': [float(p) for p in y_pred]
        }
    except Exception as e:
        raise ValueError(f"Error in linear regression: {str(e)}")

def polynomial_regression(x, y, degree=2):
    """Perform polynomial regression analysis"""
    try:
        x = np.array(x).reshape(-1, 1)
        y = np.array(y)
        
        poly_features = PolynomialFeatures(degree=degree)
        x_poly = poly_features.fit_transform(x)
        
        model = LinearRegression()
        model.fit(x_poly, y)
        
        y_pred = model.predict(x_poly)
        r2 = r2_score(y, y_pred)
        
        return {
            'coefficients': [float(c) for c in model.coef_],
            'intercept': float(model.intercept_),
            'r_squared': float(r2),
            'degree': degree,
            'predictions': [float(p) for p in y_pred]
        }
    except Exception as e:
        raise ValueError(f"Error in polynomial regression: {str(e)}")

def distribution_analysis(data):
    """Analyze distribution of data"""
    try:
        data = np.array(data)
        data = data[~np.isnan(data)]
        
        if len(data) == 0:
            raise ValueError("No valid data for analysis")
        
        # Basic statistics
        mean = np.mean(data)
        median = np.median(data)
        std = np.std(data, ddof=1)
        skew = stats.skew(data)
        kurtosis = stats.kurtosis(data)
        
        # Normality test (Shapiro-Wilk for small samples, Kolmogorov-Smirnov for larger)
        if len(data) <= 5000:
            try:
                shapiro_stat, shapiro_p = stats.shapiro(data)
                is_normal = shapiro_p > 0.05
                normality_test = {
                    'test': 'Shapiro-Wilk',
                    'statistic': float(shapiro_stat),
                    'p_value': float(shapiro_p),
                    'is_normal': is_normal
                }
            except:
                normality_test = None
        else:
            # For large samples, use Kolmogorov-Smirnov
            ks_stat, ks_p = stats.kstest(data, 'norm', args=(mean, std))
            is_normal = ks_p > 0.05
            normality_test = {
                'test': 'Kolmogorov-Smirnov',
                'statistic': float(ks_stat),
                'p_value': float(ks_p),
                'is_normal': is_normal
            }
        
        return {
            'mean': float(mean),
            'median': float(median),
            'std': float(std),
            'skewness': float(skew),
            'kurtosis': float(kurtosis),
            'min': float(np.min(data)),
            'max': float(np.max(data)),
            'q25': float(np.percentile(data, 25)),
            'q75': float(np.percentile(data, 75)),
            'normality_test': normality_test
        }
    except Exception as e:
        raise ValueError(f"Error in distribution analysis: {str(e)}")

def confidence_interval(data, confidence=0.95):
    """Calculate confidence interval"""
    try:
        data = np.array(data)
        data = data[~np.isnan(data)]
        
        mean = np.mean(data)
        std = np.std(data, ddof=1)
        n = len(data)
        
        # T-distribution for confidence interval
        alpha = 1 - confidence
        t_critical = stats.t.ppf(1 - alpha/2, df=n-1)
        margin = t_critical * (std / np.sqrt(n))
        
        return {
            'mean': float(mean),
            'lower': float(mean - margin),
            'upper': float(mean + margin),
            'confidence': confidence,
            'margin': float(margin)
        }
    except Exception as e:
        raise ValueError(f"Error calculating confidence interval: {str(e)}")
