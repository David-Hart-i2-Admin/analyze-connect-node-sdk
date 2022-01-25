/*!
 * Copyright 2022- N. Harris Computer Corporation. All rights reserved
 * SPDX-License-Identifier: MIT
 */

import { URL } from 'url';

import {
  connector,
  condition,
  records,
  service,
  Result,
  seeds,
  ISeeds,
  schema as apiSchema,
} from '@i2analyze/i2connect';

import { requestData, IComplaintDto } from './data-service';
import { nypdcomplaintdataschema as schema } from './schema/nypd-complaint-data-schema';

const baseUrl = 'https://data.cityofnewyork.us/resource/7x9x-zpz6.json';

// Set the token value here.
const token = '';
function getUrl(params: Record<string, string>) {
  const url = new URL(baseUrl);

  // Append the token value if it exists.
  if (token !== '') {
    url.searchParams.append('$$app_token', token);
  }

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value);
  }

  return url.href;
}

const { Complaint, Location, Person } = schema.entityTypes;
const { Locatedat, Suspectof, Victimof } = schema.linkTypes;

const boroughPossibleValues: apiSchema.IPossibleValue[] = [
  { displayValue: 'BROOKLYN', value: 'BROOKLYN' },
  { displayValue: 'BRONX', value: 'BRONX' },
  { displayValue: 'MANHATTAN', value: 'MANHATTAN' },
  { displayValue: 'QUEENS', value: 'QUEENS' },
  { displayValue: 'STATEN ISLAND', value: 'STATEN ISLAND' },
];

const lawCategoryPossibleValues: apiSchema.IPossibleValue[] = [
  { displayValue: 'FELONY', value: 'FELONY' },
  { displayValue: 'MISDEMEANOR', value: 'MISDEMEANOR' },
  { displayValue: 'VIOLATION', value: 'VIOLATION' },
];

const exampleSourceRef = {
  name: 'NYPD Complaint Dataset',
  type: 'Open source data',
  description: 'A source reference to the corresponding record from the NYPD Complaint Dataset.',
};

function addLocation(datum: IComplaintDto, result: Result) {
  const locationId = `Borough: ${datum.boro_nm} Precinct: ${datum.addr_pct_cd}`;
  const entity = result.addEntity(Location, locationId);

  entity.setProperties({
    'Precinct Code': parseInt(datum.addr_pct_cd, 10),
    'Borough Name': datum.boro_nm,
    Coordinates: {
      type: 'Point',
      coordinates: [parseInt(datum.latitude, 10), parseInt(datum.longitude, 10)],
    },
  });

  entity.setSourceReference(exampleSourceRef);

  return entity;
}

function addComplaint(datum: IComplaintDto, result: Result) {
  const complaintId = `Complaint: ${datum.cmplnt_num}`;
  const entity = result.addEntity(Complaint, complaintId);

  entity.setProperties({
    'Complaint Number': datum.cmplnt_num,
    'Crime Status': datum.crm_atpt_cptd_cd,
    'Jurisdiction Code': parseInt(datum.jurisdiction_code, 10),
    'Offence Classification Code': parseInt(datum.ky_cd, 10),
    'Level Of Offence': datum.law_cat_cd,
    'Offence Description': datum.ofns_desc,
  });

  entity.setSourceReference(exampleSourceRef);

  return entity;
}

function addSuspect(datum: IComplaintDto, result: Result) {
  const suspectId = `Suspect: ${datum.cmplnt_num}`;
  const entity = result.addEntity(Person, suspectId);

  entity.setProperties({
    'Age Group': datum.susp_age_group,
    Race: datum.susp_race,
    Sex: datum.susp_sex,
  });

  entity.setSourceReference(exampleSourceRef);

  return entity;
}

function addVictim(datum: IComplaintDto, result: Result) {
  const victimId = `Victim: ${datum.cmplnt_num}`;
  const entity = result.addEntity(Person, victimId);

  entity.setProperties({
    'Age Group': datum.vic_age_group,
    Race: datum.vic_race,
    Sex: datum.vic_sex,
  });

  entity.setSourceReference(exampleSourceRef);

  return entity;
}

function addLink(
  linkType: apiSchema.ILinkType,
  id: string,
  fromEnd: records.IResultEntityRecord | records.ISeededResultEntityRecord,
  toEnd: records.IResultEntityRecord | records.ISeededResultEntityRecord,
  result: Result
) {
  const link = result.addLink(linkType, id, fromEnd, toEnd);
  link.setSourceReference(exampleSourceRef);
}

@connector({
  schemas: { connector: schema },
})
export class NYPDConnector {
  @service({
    name: 'NYPD Connector: Get all',
    description: 'A service that retrieves all data.',
  })
  public async getAll(): Promise<Result> {
    const result = new Result();

    // The maximum number of rows returned from the NYPD complaint dataset
    const url = getUrl({ $limit: '100' });
    const data = await requestData(url);

    for (const datum of data) {
      const locationEntity = addLocation(datum, result);
      const complaintEntity = addComplaint(datum, result);
      const suspectEntity = addSuspect(datum, result);
      const victimEntity = addVictim(datum, result);

      addLink(Locatedat, datum.cmplnt_num, complaintEntity, locationEntity, result);
      addLink(Victimof, datum.cmplnt_num, victimEntity, complaintEntity, result);
      addLink(Suspectof, datum.cmplnt_num, suspectEntity, complaintEntity, result);
    }

    return result;
  }

  @service({
    name: 'NYPD Connector: Search',
    description: 'A service for conditional searches.',
  })
  public async findComplaint(
    @condition({
      label: 'Borough name',
      logicalType: 'selectedFromList',
      isMandatory: true,
      possibleValues: boroughPossibleValues,
    })
    borough: string,
    @condition({
      label: 'Law category',
      logicalType: 'selectedFromList',
      isMandatory: true,
      possibleValues: lawCategoryPossibleValues,
    })
    lawCategory: string
  ): Promise<Result> {
    const result = new Result();

    const url = getUrl({
      $limit: '50',
      $where: `boro_nm="${borough}" AND law_cat_cd="${lawCategory}"`,
    });
    const data = await requestData(url);

    for (const datum of data) {
      addComplaint(datum, result);
    }

    return result;
  }

  @service({
    name: 'NYPD Connector: Find like this complaint',
    description: 'A service that finds a similar complaint.',
  })
  public async findSimilarComplaint(
    @seeds({ typeConstraints: [Complaint], min: 1, max: 1 }) seeds: ISeeds
  ): Promise<Result> {
    const result = new Result();

    const seed = seeds.entities[0];
    const levelOfOffence = seed.getProperty(Complaint, 'Level Of Offence') || '';

    const url = getUrl({
      $limit: '50',
      $where: `law_cat_cd="${levelOfOffence}"`,
    });
    const data = await requestData(url);

    for (const datum of data) {
      addComplaint(datum, result);
    }

    return result;
  }

  @service({
    name: 'NYPD Connector: Expand',
    description: 'A service that executes an expand operation on a seed.',
  })
  public async expand(
    @seeds({ typeConstraints: [Complaint, Location], min: 1, max: 1 }) seeds: ISeeds
  ): Promise<Result> {
    const result = new Result();

    const seed = seeds.entities[0];
    const complaintNumber = seed.getProperty(Complaint, 'Complaint Number') || '';
    const boroughName = seed.getProperty(Location, 'Borough Name') || '';
    const precinctCode = seed.getProperty(Location, 'Precinct Code') || '';

    const query = seed.isType(Complaint)
      ? { $where: `cmplnt_num=${complaintNumber}` }
      : { $where: `boro_nm="${boroughName}" AND addr_pct_cd=${precinctCode}` };

    const url = getUrl({
      $limit: '50',
      ...query,
    });
    const data = await requestData(url);

    const seedEntity = seed.isType(Complaint) ? result.addEntityFromSeed(seed) : result.addEntityFromSeed(seed);

    for (const datum of data) {
      const complaintEntity = seed.isType(Complaint) ? seedEntity : addComplaint(datum, result);
      const locationEntity = seed.isType(Location) ? seedEntity : addLocation(datum, result);

      const suspectEntity = addSuspect(datum, result);
      const victimEntity = addVictim(datum, result);

      addLink(Locatedat, datum.cmplnt_num, complaintEntity, locationEntity, result);
      addLink(Victimof, datum.cmplnt_num, victimEntity, complaintEntity, result);
      addLink(Suspectof, datum.cmplnt_num, suspectEntity, complaintEntity, result);
    }

    return result;
  }

  @service({
    name: 'NYPD Connector: Expand with conditions',
    description: 'A service that executes an expand operation on a seed, with conditions.',
  })
  public async expandWithConditions(
    @condition({ label: 'Person', logicalType: 'boolean' }) isPerson: boolean,
    @seeds({ typeConstraints: [Complaint], min: 1, max: 1 }) seeds: ISeeds
  ): Promise<Result> {
    const result = new Result();

    const seed = seeds.entities[0];
    const complaintNumber = seed.getProperty(Complaint, 'Complaint Number') || '';

    const url = getUrl({
      $limit: '50',
      $where: `cmplnt_num=${complaintNumber}`,
    });
    const data = await requestData(url);

    const seedEntity = result.addEntityFromSeed(seed);

    for (const datum of data) {
      if (isPerson) {
        const suspectEntity = addSuspect(datum, result);
        const victimEntity = addVictim(datum, result);

        addLink(Suspectof, datum.cmplnt_num, suspectEntity, seedEntity, result);
        addLink(Victimof, datum.cmplnt_num, victimEntity, seedEntity, result);
      }

      const locationEntity = addLocation(datum, result);
      addLink(Locatedat, datum.cmplnt_num, seedEntity, locationEntity, result);
    }

    return result;
  }
}
