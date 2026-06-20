function transform(input) {
  const NES_LOCALE = input?.trmnl?.user?.locale || 'en-US';

  let raw;

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

  const dateOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZone: input?.trmnl?.user?.time_zone_iana
  };

  const updateDateTime = raw?.UpdateDateTime ?? null;

  let updateDateTimeFormatted = null;

  if (updateDateTime) {
    const match = /Date\((\d+)\)/.exec(updateDateTime);

    if (match) {
      const timestamp = Number(match[1]);

      if (!Number.isNaN(timestamp)) {
        updateDateTimeFormatted = new Date(timestamp).toLocaleString(
          NES_LOCALE,
          dateOptions
        );
      }
    }
  }

  const originalList = Array.isArray(raw?.MapList)
    ? raw.MapList
    : [];

  const minimalList = [];
  let totalAffected = 0;

  for (const item of originalList) {
    const x = Number(item?.X1);
    const y = Number(item?.Y1);
    const affected = Number(item?.CustAffected);

    const validCoordinates =
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      y >= -90 &&
      y <= 90 &&
      x >= -180 &&
      x <= 180;

    if (!validCoordinates) {
      continue;
    }

    minimalList.push({
      X1: x,
      Y1: y,
      CustAffected: affected
    });

    if (Number.isFinite(affected)) {
      totalAffected += affected;
    }
  }

  const totalIncidents = minimalList.length;

  const COLLAPSE_THRESHOLD = 1000;
  const collapsed = totalIncidents > COLLAPSE_THRESHOLD;

  return {
    Collapsed: collapsed,
    TotalIncidents: totalIncidents,
    TotalAffected: totalAffected,
    MapList: collapsed ? [] : minimalList,
    UpdateDateTime: updateDateTime,
    UpdateDateTimeFormatted: updateDateTimeFormatted
  };
}
