/**
 * TRMNL Sandbox Transform
 * Reduces NES outage payload to stay under 100KB.
 * - Keeps only fields used by templates: X1 (lon), Y1 (lat), CustAffected
 * - Adds totals: TotalIncidents, TotalAffected
 * - If incidents > 10,000, collapses markers (MapList = []) to avoid huge payload
 *
 * Docs: https://help.usetrmnl.com/en/articles/12996946-parsing-plugins-with-the-sandbox-runtime
 */

/**
 * TRMNL calls a global `transform(input)` in the sandbox.
 * Use conservative syntax for maximal compatibility.
 * @param {string|Object} input - Raw response body string or already-parsed JSON
 * @returns {Object} JSON object to feed templates
 */
function transform(input) {
  // Parse input safely
  var raw;
  try {
    raw = typeof input === 'string' ? JSON.parse(input) : input;
  } catch (err) {
    return {
      Collapsed: true,
      TotalIncidents: 0,
      TotalAffected: 0,
      MapList: [],
      UpdateDateTime: null,
      UpdateDateTimeFormatted: null,
      _error: 'Failed to parse input JSON'
    };
  }

  var updateDateTime = raw && raw.UpdateDateTime ? raw.UpdateDateTime : null;
  var updateDateTimeFormatted = raw && raw.UpdateDateTimeFormatted ? raw.UpdateDateTimeFormatted : null;

  var originalList = raw && Array.isArray(raw.MapList) ? raw.MapList : [];

  // Keep only needed fields and drop invalid coordinates
  var minimalList = [];
  var totalAffected = 0;

  for (var i = 0; i < originalList.length; i++) {
    var item = originalList[i];
    var x = Number(item && item.X1);
    var y = Number(item && item.Y1);
    var affected = Number(item && item.CustAffected);

    if (
      isFinite(x) && isFinite(y) &&
      y >= -90 && y <= 90 && x >= -180 && x <= 180
    ) {
      minimalList.push({ X1: x, Y1: y, CustAffected: affected });
      if (isFinite(affected)) totalAffected += affected;
    }
  }

  var totalIncidents = minimalList.length;

  // Collapse when too many points to plot
  var COLLAPSE_THRESHOLD = 10000;
  var collapsed = totalIncidents > COLLAPSE_THRESHOLD;

  // Return collapsed structure (no markers) when threshold exceeded
  if (collapsed) {
    return {
      Collapsed: true,
      TotalIncidents: totalIncidents,
      TotalAffected: totalAffected,
      MapList: [],
      UpdateDateTime: updateDateTime,
      UpdateDateTimeFormatted: updateDateTimeFormatted
    };
  }

  // Otherwise return minimal list with totals
  return {
    Collapsed: false,
    TotalIncidents: totalIncidents,
    TotalAffected: totalAffected,
    MapList: minimalList,
    UpdateDateTime: updateDateTime,
    UpdateDateTimeFormatted: updateDateTimeFormatted
  };
}
