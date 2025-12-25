declare module '@mapbox/polylabel' {
  /**
   * Finds the pole of inaccessibility for a polygon
   * @param polygon - GeoJSON polygon coordinates [[[x, y], [x, y], ...]]
   * @param precision - Precision (1.0 = high precision)
   * @returns [x, y] coordinates of the optimal label position
   */
  function polylabel(
    polygon: number[][][],
    precision?: number,
  ): [number, number];
  export default polylabel;
}
