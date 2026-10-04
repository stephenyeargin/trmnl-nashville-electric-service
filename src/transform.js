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

  const updateDateTime = Number(raw?.IDX_1?.lastUpdatedTime) || null;
  const updateDateTimeFormatted = updateDateTime
    ? new Date(updateDateTime).toLocaleString(NES_LOCALE, dateOptions)
    : null;

  const originalList = Array.isArray(raw?.IDX_0?.data)
    ? raw.IDX_0.data
    : [];

  const minimalList = [];
  let totalAffected = 0;

  for (const item of originalList) {
    const x = Number(item?.longitude);
    const y = Number(item?.latitude);
    const affected = Number(item?.numPeople);

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
