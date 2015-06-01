'use strict';

import _ from 'lodash';
import React from 'react';
import {Map, Marker, Popup, TileLayer} from 'react-leaflet';
import {Link} from 'react-router';

import {HELSINKI_COORDINATES} from '../constants/AppConstants';
import {getBounds, getPosition} from '../core/mapUtils';

function getMarker(school) {
  const position = getPosition(school.location);
  return (
    <Marker key={school.id} position={position} ref={'marker-' + school.id}>
      <Popup>
        <span>
          <Link params={{schoolId: school.id}} to='school'>{school.name.officialName}</Link>
        </span>
      </Popup>
    </Marker>
  );
}

class SearchMap extends React.Component {
  componentDidMount() {
    this.map = this.refs.map.getLeafletElement();
    const coordinates = this.getCoordinates(this.props);
    this.centerMap(coordinates);
  }

  componentWillUpdate(nextProps) {
    const coordinates = this.getCoordinates(nextProps);
    this.marker = this.getMarker(nextProps.selectedSchool);
    this.centerMap(coordinates);
  }

  centerMap(coordinates) {
    if (coordinates.length) {
      const bounds = getBounds(coordinates);
      this.map.fitBounds(bounds, {padding: [50, 50]});
    }
    if (this.marker) {
      this.marker.openPopup();
    }
  }

  getMarker(schoolId) {
    if (schoolId) {
      return this.refs['marker-' + schoolId].getLeafletElement();
    }
    return null;
  }

  getCoordinates(props) {
    let coordinates = [];
    if (props.selectedSchool) {
      const school = _.find(
        props.schoolList, current => current.id === props.selectedSchool
      );
      if (school) {
        coordinates.push(school.location.coordinates);
      }
    } else {
      coordinates = _.pluck(props.schoolList, ['location', 'coordinates']);
    }
    return coordinates;
  }

  render() {
    const showDefaultLocation = !this.props.schoolList.length && !this.props.fetchingData;
    const position = showDefaultLocation ? HELSINKI_COORDINATES : null;
    const zoom = this.props.zoom || 12;
    return (
      <Map
        center={position}
        ref='map'
        zoom={zoom}
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
        />
        {this.props.schoolList.map(getMarker)}
      </Map>
    );
  }
}

SearchMap.propTypes = {
  fetchingData: React.PropTypes.bool,
  schoolList: React.PropTypes.array.isRequired,
  selectedSchool: React.PropTypes.number,
  zoom: React.PropTypes.number
};

export default SearchMap;