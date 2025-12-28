# Comparison Analysis UI Implementation Plan

## Overview
Implement a side-by-side comparison view for two selected commercial areas. This view is triggered when the user selects two areas and clicks "Analyze Comparison".

## Features

1.  **Comparison Overlay**:
    *   A centered overlay displaying two cards.
    *   Responsive design (side-by-side on desktop).
    *   Background dimming (modal-like).

2.  **Analysis Card**:
    *   **Header**: Area Name, Address (with copy function), Area Type/Radius/Size.
    *   **Tabs**: Commercial Area, Store, Population.
    *   **Main Metric**: Estimated Monthly Sales (Big bold number).
    *   **Graph**: 1-year sales trend graph (Visual only for now, using mock data/SVG).
    *   **Footer**: "Clear Area" button, "Close" button.

3.  **State Management**:
    *   `page.tsx`: Add `isComparing` state.
    *   `MapBox`: Pass logic to trigger `isComparing = true`.

## Component Structure

*   `apps/web/components/comparison/ComparisonOverlay.tsx`: Main container.
*   `apps/web/components/comparison/AnalysisCard.tsx`: Individual card component.
*   `apps/web/components/comparison/SalesTrendGraph.tsx`: Simple SVG graph component.

## Data Flow
1.  User selects Location A and B in `CompareContents`.
2.  User clicks "Compare".
3.  `BottomMenuBox` calls `onCompare`.
4.  `page.tsx` receives event, sets `state.isComparing = true`.
5.  `ComparisonOverlay` renders with data for A and B.

## Mock Data Strategy
Since backend data might not be fully ready for specific sales estimates, we will use realistic mock data for the UI demonstration.

## Tasks
1.  Create `AnalysisCard` component.
2.  Create `SalesTrendGraph` component.
3.  Create `ComparisonOverlay` component.
4.  Integrate with `page.tsx` and `BottomMenuBox`.
