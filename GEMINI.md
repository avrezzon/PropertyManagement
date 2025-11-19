# Rental Expense Forecaster: Comprehensive Documentation

This document provides an in-depth overview of the Rental Expense Forecaster, a sophisticated React-based financial simulation tool engineered specifically for landlords and property managers operating under TriStar Property Management agreements. Unlike generic mortgage calculators, this application bridges the gap between theoretical income and the complex reality of property management fees, maintenance variability, and lease turnover costs. By integrating specific contract terms directly into the calculation engine, it offers a "true net" perspective on rental asset performance.

## 🌟 Key Features & Capabilities

### 1. Flexible & Robust Forecasting Engine

The core of the application is a dynamic projection engine designed to handle diverse planning horizons.

* **Customizable Forecast Duration**: Users are not limited to a single fiscal year. The tool supports simulations ranging from 1 to 10 years. This range empowers investors to conduct short-term cash flow analysis (e.g., "Will I cover the mortgage this year?") as well as long-term ROI projections (e.g., "What is my ten-year annualized return considering inflation and rent growth?").

* **Precision Start Date Control**: Real estate fiscal years rarely align perfectly with calendar years. The tool allows for a precise Start Date selection (Month and Year), defaulting to December 2025 but fully adjustable. This ensures that projections align with actual lease commencements or property acquisition dates.

* **Dynamic Timeline Visualization**: The interface is reactive; changing the duration instantly re-renders the monthly breakdown table. This responsive design allows users to toggle between high-level multi-year views and granular month-by-month inspections without page reloads.

### 2. Advanced Lease Management System

Real-world leasing is rarely a continuous, unbroken line of income. This feature set models the chaotic nature of tenant turnover and lease negotiation.

* **Segmented Lease Architecture**: The tool treats time as a series of "Lease Segments" rather than a monolith. Users can chain together distinct periods for "New Tenants" (which trigger leasing fees) and "Lease Renewals" (which trigger lower renewal fees). This accurately models the lifecycle of a rental property.

* **Automated Gap & Vacancy Analysis**: One of the most critical hidden costs in rental investing is vacancy. The system automatically detects gaps between the end of one lease segment and the start of the next. For these "Vacant" months, it suppresses rental income and automatically applies Vacancy Utility costs, simulating the owner's responsibility for heating and electricity during turnover.

* **Market-Driven Rent Control**: Rents are not static. The tool allows users to set specific rental rates for each lease segment. This capability allows landlords to forecast rent increases (or decreases) over time, simulating market adjustments and the compounding value of lease renewals.

* **Intelligent Marketing Fee Logic**: The contract stipulates a $150 Photo/Marketing Fee for new tenants. However, this is often a one-time setup cost. The tool includes a smart toggle with a date picker. If a user indicates that photos were paid for in a previous period (e.g., 2 years ago), the system intelligently excludes this fee from future forecasts, preventing "double-billing" in the projection and ensuring historical accuracy.

### 3. Granular Expense Tracking & Simulation

Accurate net income calculation requires capturing more than just the mortgage and management fee.

* **Comprehensive Move-Out Estimator**: Turnover costs are often underestimated. The application features a dedicated modal that breaks down turnover expenses into specific categories:

    * Professional Cleaning: Mandatory in many leases.

    * Carpet Cleaning: Specific costs for deep cleaning.

    * Re-keying: Essential security cost between tenants.

    * General Repairs: A catch-all for painting or minor fixes.

    * Impact: These costs are summed and applied to the specific month of turnover, providing a realistic "cash crunch" visualization during vacancy months.

* **Conditional Repair Coordination**: The tool encodes the specific TriStar contract clause regarding maintenance coordination. Users can inject repair events into any specific month. The system then evaluates the cost against the $2,000 threshold. If the repair is under the limit, no extra fee is charged. If it exceeds the limit, a 10% Coordination Fee is automatically calculated and added to the expense column, ensuring strict adherence to the Property Management Agreement (PMA).

* **Variable & Seasonal Cost Modeling**:

    * Dynamic Mortgage: Mortgages often change due to escrow adjustments for taxes and insurance. Users can update the "Base Mortgage" starting from any specific month, propagating that change forward to model tax hikes or refinancing.

    * Seasonal Utilities: Utilities are not constant. The tool allows for month-specific overrides, enabling users to budget for higher heating bills in January or AC costs in July during vacancy periods.

### 4. Interactive Financial Insights

The tool prioritizes transparency, helping users understand where every dollar goes.

* **Context-Aware Smart Tooltips**: The financial table is dense with data. To aid comprehension, hovering over any fee cell reveals a detailed popup explaining the calculation logic (e.g., "Leasing Fee: 50% of 1st Month Rent ($1,250)" vs. "Management Fee: 10% of Gross Rent ($250)"). This educational feature helps owners verify contract terms against real-world numbers.

* **True Net Cash Flow Calculation**: The bottom line is what matters. The application calculates a "True Net" figure that goes beyond Net Operating Income (NOI). It subtracts all operating expenses (management, repairs, utilities, HOA) and debt service (mortgage) to show the actual cash hitting the owner's bank account—or the cash contribution required to keep the property afloat.

## 🛠️ Detailed Usage Guide

### Step 1: Initial Configuration & Baseline Setup

Begin by establishing the fundamental financial parameters of the property. At the top of the dashboard:

1. Analysis Start Date: Select the month and year you wish to begin the forecast. This is useful for "mid-year" takeovers or future acquisition planning.

2. Base Mortgage: Input your current total monthly payment (Principal, Interest, Taxes, Insurance).

3. Forecast Duration: Choose the timeline scope (1-10 years). Longer durations are better for seeing the impact of rent increases.

4. Base Vacancy Utils: Estimate the monthly cost of keeping the lights and heat on when the unit is empty.

### Step 2: Building the Lease Timeline

Use the "Lease Configuration" section to construct a realistic timeline of tenancy:

1. New Tenant Scenario: Click to add a new lease segment. Define the Start Month, the Duration (e.g., 12 months), and the target Monthly Rent.

2. Modeling Renewals: Use the "Add Renewal" button to simulate a tenant staying. This automatically switches the fee structure from the expensive "Leasing Fee" to the cheaper "Renewal Fee."

3. Creating Gaps: To simulate vacancy, simply set the start month of a new lease segment to be one or more months after the previous one ends. The system visually highlights this gap and applies vacancy utility costs automatically.

4. Marketing Fee Configuration: For "New Tenant" segments, check the camera icon toggle. If you already possess valid marketing photos, use the date picker to select a past date. The system will recognize this as "paid previously" and waive the $150 fee in the forecast.

### Step 3: Injecting Real-World Events

Static spreadsheets fail to capture life's surprises. Use the interactive table features:

1. Budgeting for Turnover: Locate a lease segment in the configuration area and click the pencil icon next to "Move-Out Est." Input estimated costs for cleaning and repairs. These will appear in the timeline immediately following the lease end.

2. Simulating Repairs: In the monthly breakdown table, click the + or Wrench icon on a specific month (e.g., Month 6) to add a hypothetical repair (e.g., "Water Heater Failure - $1,200"). The tool will calculate the total cost and check if a coordination fee applies.

## 📋 Embedded Contract Logic

This tool is not a generic calculator; it is hard-coded with the specific financial terms derived from the TriStar Property Management Agreement.

|   Fee Type | Rate / Cost | Contract Condition & Application |
| --- | --- | --- |
| Management Fee | 10% | Charged monthly on gross rent collected. If the property is vacant, this fee drops to $0. |
| Leasing Fee | 50% | A significant one-time fee charged when placing a New Tenant. Calculated as 50% of the first full month's rent. |
| Renewal Fee | 10% | A reduced one-time fee charged when an Existing Tenant signs a new lease extension. Calculated as 10% of one month's rent. |
| Marketing Fee | $150 | A flat fee covering photos and listing setup. This is waivable logic if the owner provides existing, usable assets. |
| Repair Coordination | 10% | A project management fee. It is conditional: it only triggers if a single repair project exceeds $2,000. Smaller repairs incur no extra fee. |
| Maintenance Survey | $100 | An inspection fee charged annually or at move-out to document property condition. |
| HOA Fees | $240/mo | A recurring fixed cost that must be paid regardless of occupancy status. |
| HOA Setup | $150 | A one-time administrative transfer fee, typically forecasted in the first month of ownership/management. |

## 💻 Technical Architecture

* Frontend Framework: React.js - Selected for its component-based architecture, allowing for efficient state management of complex, multi-year lease timelines and instant recalculations.
* Styling Engine: Tailwind CSS - Utilized for its utility-first approach, enabling a responsive, clean, and modern UI that works seamlessly across devices.
* Iconography: Lucide React - Provides a consistent, lightweight set of visual indicators (wrenches, calendars, dollar signs) to improve user experience and data readability.

## 🛠️ Development Workflow

* **Feature Branches**: Always create a new feature branch when implementing a new feature. Do not commit directly to the main branch for new features. Use a descriptive name for the branch (e.g., `feature/add-login-page`).
* **Pull Requests**: When the feature is complete, open a Pull Request (PR) including the walkthrough to help with tracking the updates.