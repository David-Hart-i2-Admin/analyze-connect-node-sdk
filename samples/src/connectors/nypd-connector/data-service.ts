/*!
 * Copyright 2022- N. Harris Computer Corporation. All rights reserved
 * SPDX-License-Identifier: MIT
 */

import fetch from 'node-fetch';

export interface IComplaintDto {
  /**
   * Complaint number
   */
  readonly cmplnt_num: string;
  /**
   * Crime status
   */
  readonly crm_atpt_cptd_cd: string;
  /**
   * Jurisdiction code
   */
  readonly jurisdiction_code: string;
  /**
   * Offense classification code
   */
  readonly ky_cd: string;
  /**
   * Level of offense
   */
  readonly law_cat_cd: string;
  /**
   * Offense description
   */
  readonly ofns_desc: string;
  /**
   * Precinct code
   */
  readonly addr_pct_cd: string;
  /**
   * Borough name
   */
  readonly boro_nm: string;
  /**
   * Coordinates - latitude
   */
  readonly latitude: string;
  /**
   * Coordinates - longitude
   */
  readonly longitude: string;
  /**
   * Victim age group
   */
  readonly vic_age_group: string;
  /**
   * Victim race
   */
  readonly vic_race: string;
  /**
   * Victim sex
   */
  readonly vic_sex: string;
  /**
   * Suspect age group
   */
  readonly susp_age_group: string;
  /**
   * Suspect race
   */
  readonly susp_race: string;
  /**
   * Suspect sex
   */
  readonly susp_sex: string;
}

/**
 * Create a Promise from the request.
 * @param url - The URL used to query the NYPD complaint dataset.
 */
export async function requestData(url: string): Promise<IComplaintDto[]> {
  const response = await fetch(url);
  if (response.status === 200) {
    return (await response.json()) as IComplaintDto[];
  } else {
    throw new Error(response.statusText);
  }
}
