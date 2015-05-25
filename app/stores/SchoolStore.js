'use strict';

import _ from 'lodash';
import AppDispatcher from '../core/AppDispatcher';
import ActionTypes from '../constants/ActionTypes';
import BaseStore from './BaseStore';
import BuildingStore from './BuildingStore';
import PrincipalStore from './PrincipalStore';
import {sortByYears} from '../core/utils';

let _schools = {};
let _fetchingData = false;

const SchoolStore = Object.assign({}, BaseStore, {
  getBeginAndEndYear: _getSchoolByIdWrapper(getBeginAndEndYear, {}),
  getFetchingData,
  getMainBuilding: _getSchoolByIdWrapper(getMainBuilding, {}),
  getMainBuildingInYear: _getSchoolByIdWrapper(getMainBuildingInYear, {}),
  getMainName: _getSchoolByIdWrapper(getMainName, {}),
  getSchoolDetails: _getSchoolByIdWrapper(getSchoolDetails, {}),
  getSchoolYearDetails: _getSchoolByIdWrapper(getSchoolYearDetails, {}),
  getSchools,
  hasSchool
});

SchoolStore.dispatchToken = AppDispatcher.register(function(payload) {
  AppDispatcher.waitFor([
    BuildingStore.dispatchToken,
    PrincipalStore.dispatchToken
  ]);

  const action = payload.action;

  switch (action.type) {

    case ActionTypes.REQUEST_SCHOOL:
      _fetchingData = true;
      SchoolStore.emitChange();
      break;

    case ActionTypes.REQUEST_SCHOOL_SUCCESS:
      _fetchingData = false;
      _receiveSchools(action.response.entities);
      SchoolStore.emitChange();
      break;

    case ActionTypes.REQUEST_SEARCH_LOAD_MORE:
      SchoolStore.emitChange();
      break;

    case ActionTypes.REQUEST_SEARCH_SUCCESS:
      _receiveSchools(action.response.entities);
      SchoolStore.emitChange();
      break;

    default:
      // noop
  }
});

function getBeginAndEndYear(school) {
  const currentName = _.first(school.names);
  const oldestName = _.last(school.names);
  return {
    beginYear: oldestName ? oldestName.begin_year : null,
    endYear: currentName ? currentName.end_year : null
  };
}

function getFetchingData() {
  return _fetchingData;
}

function getMainBuilding(school) {
  return _.first(school.buildings) || {};
}

function getMainBuildingInYear(school, year) {
  if (!year) {
    return getMainBuilding(school);
  }
  return _getItemForYear(school, 'buildings', year) || {};
}

function getMainName(school) {
  return _.first(school.names) || {};
}

function getSchoolDetails(school) {
  return {
    archives: school.archives,
    buildings: _getRelationalData(school.buildings, BuildingStore.getBuilding),
    fields: school.fields,
    genders: school.genders,
    languages: school.languages,
    names: school.names,
    principals: _getRelationalData(school.principals, PrincipalStore.getPrincipal),
    types: school.types
  };
}

function getSchools(schoolIds) {
  return _.map(schoolIds, function(id) {
    const school = _schools[id];
    if (_.isEmpty(school)) {
      return {};
    }
    let addresses = [];
    const schoolBuilding = getMainBuilding(school);
    const building = _getRelationanlObject(schoolBuilding, BuildingStore.getBuilding);
    if (building && building.addresses) {
      addresses = building.addresses;
    }
    const address = (
      addresses.length ?
      `${addresses[0].street_name_fi}\, ${addresses[0].municipality_fi}` :
      ''
    );
    return {
      id: id,
      name: getMainName(school).official_name,
      address: address
    };
  }, this);
}

function getSchoolYearDetails(school, year) {
  year = year || new Date().getFullYear();

  const schoolBuilding = _getItemForYear(school, 'buildings', year);
  const building = schoolBuilding ? BuildingStore.getBuilding(schoolBuilding.id) : {};
  const schoolPrincipal = _getItemForYear(school, 'principals', year);
  const principal = schoolPrincipal ? PrincipalStore.getPrincipal(schoolPrincipal.id) : {};

  return {
    archive: _getItemForYear(school, 'archives', year) || {},
    building: building,
    principal: principal,
    schoolName: _getItemForYear(school, 'names', year) || {}
  };
}

function hasSchool(schoolId) {
  return typeof _schools[schoolId] !== 'undefined';
}

function _getItemForYear(school, itemListName, year) {
  return _.find(school[itemListName], function(item) {
    return item.begin_year <= year;
  });
}

function _getRelationalData(relationObjects, getter) {
  return _.map(relationObjects, function(relationObject) {
    return _getRelationanlObject(relationObject, getter);
  });
}

function _getRelationanlObject(relationObject, getter) {
  let object = getter(relationObject.id);
  return _.assign(object, {
    'begin_year': relationObject.begin_year,
    'end_year': relationObject.end_year
  });
}

function _getSchoolByIdWrapper(func, defaultValue) {
  return function(schoolId) {
    defaultValue = defaultValue ? defaultValue : [];
    const school = _schools[schoolId];
    let newArgs = Array.prototype.slice.call(arguments, 1);
    newArgs.unshift(school);
    return _.isEmpty(school) ? defaultValue : func.apply(this, newArgs);
  };
}

function _parseRelationalData(relationObjects, relationIds, objectName) {
  let relationObject;
  return _.map(relationIds, function(id) {
    relationObject = relationObjects[id];
    return _.assign({}, relationObject, {id: relationObject[objectName]});
  });
}

function _receiveSchools(entities) {
  _.each(entities.schools, function(school) {
    _schools[school.id] = {
      archives: sortByYears(school.archives),
      buildings: sortByYears(_parseRelationalData(
        entities.schoolBuildings,
        school.buildings,
        'building'
      )),
      fields: sortByYears(school.fields),
      genders: sortByYears(school.genders),
      id: school.id,
      languages: sortByYears(school.languages),
      names: sortByYears(school.names),
      principals: sortByYears(_parseRelationalData(
        entities.schoolPrincipals,
        school.principals,
        'principal'
      )),
      types: sortByYears(school.types)
    };
  });
}

export default SchoolStore;
