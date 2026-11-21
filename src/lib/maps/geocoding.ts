/**
 * Parses Google Maps Geocoder / Places `address_components` into structured
 * civic location fields (Street Address, City, State, and District/Locality).
 */

export interface AddressComponentLike {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface ParsedGeocodedLocation {
  address: string;
  city: string;
  state: string;
  district: string;
}

function findComponent(
  components: AddressComponentLike[],
  preferredTypes: string[],
): string {
  for (const type of preferredTypes) {
    const match = components.find((c) => c.types.includes(type));
    if (match?.long_name?.trim()) {
      return match.long_name.trim();
    }
  }
  return "";
}

/**
 * Extracts normalized street address, city, state, and district/locality from
 * Google Maps `GeocoderResult` or `PlaceResult`.
 */
export function parseGoogleAddressComponents(
  components: AddressComponentLike[] | undefined,
  formattedAddress?: string,
  placeName?: string,
): ParsedGeocodedLocation {
  const list = components ?? [];

  const streetNumber = findComponent(list, ["street_number"]);
  const route = findComponent(list, ["route"]);
  const premise = findComponent(list, ["premise", "subpremise", "point_of_interest"]);
  const neighborhood = findComponent(list, [
    "sublocality_level_2",
    "sublocality_level_1",
    "sublocality",
    "neighborhood",
  ]);
  const city = findComponent(list, [
    "locality",
    "postal_town",
    "administrative_area_level_2",
  ]);
  const state = findComponent(list, ["administrative_area_level_1"]);
  const district =
    findComponent(list, [
      "sublocality_level_1",
      "sublocality",
      "neighborhood",
      "administrative_area_level_3",
      "administrative_area_level_2",
    ]) || city;

  const streetParts = [streetNumber, route].filter(Boolean).join(" ").trim();
  let address =
    streetParts ||
    [placeName, neighborhood].filter(Boolean).join(", ").trim() ||
    premise ||
    neighborhood;

  if (!address && formattedAddress) {
    const firstSegment = formattedAddress.split(",")[0]?.trim() ?? "";
    address = firstSegment || formattedAddress.trim();
  }

  return {
    address: address || formattedAddress?.trim() || "",
    city,
    state,
    district,
  };
}
