import React, { Component } from 'react'
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api'
import { getKey } from '../apis/auth'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import AddModal from './AddModal'
import AddItemByAddress from './AddItemByAddress'
import { showAddItemModal, updateItemModal } from '../actions/modals'
import { getCategories, getSeasons } from '../apis/items'

const googleMapStyles = require('../../public/GoogleMapStyles.json')
const libraries = ["places"]

export class Map extends Component {

  constructor(props) {
    super(props)
    this.state = {
      center: {
        lat: -41.2743523,
        lng: 174.735582
      },
      zoom: 12,
      pins: [],
      key: false,
      addMode: false,
      addForm: false,
      addByAddressForm: false,
      showModal: false,
      infoWindowShowing: false,
      activePin: null
    }
    this.openWindow = this.openWindow.bind(this)
    this.closeWindow = this.closeWindow.bind(this)
  }

  componentDidMount() {
    getKey()
      .then(() => {
        this.setState({ key: true })
      })
    getCategories()
      .then(categoryData => {
        this.setState({ categoryData })
      })
    getSeasons()
      .then(seasonData => {
        this.setState({ seasonData })
      })
  }

  componentDidUpdate(prevProps) {
    if (this.props.items !== prevProps.items) {
      this.setState({
        pins: this.props.items.map((item) => {
          var location = {
            lat: item.lat,
            lng: item.long
          }
          return location
        })
      })
    }

    if (this.props.currentItem != prevProps.currentItem) {
      this.setState({
        center: {
          lat: this.props.currentItem.lat,
          lng: this.props.currentItem.long
        },
        zoom: 18
      })
    }
  }

  toggleAddForm = (e) => {
    this.setState({
      addForm: !this.state.addForm
    })
  }

  toggleAddByAddressForm = (e) => {
    this.setState({
      addByAddressForm: !this.state.addByAddressForm
    })
  }

  toggleAddMode = (e) => {
    this.setState({
      addMode: !this.state.addMode
    })
  }

  handleAddPin = (e) => {
    if (this.state.addMode) {
      let newPin = { lat: e.latLng.lat(), lng: e.latLng.lng() }
      this.props.showAddItemModal(newPin)
    }
  }

  openWindow(index) {
    this.setState({
      activePin: this.props.items[index]
    })
  }

  closeWindow() {
    this.setState({
      activePin: null
    })
  }

  handleIcons = category => {
    return '/images/Avocado.svg'
    //need to read from file and do a string.includes on each
  }

  render() {
    let mapHeight = '95vh'
    if(window.innerWidth < 992) mapHeight = '75vh'

    return (

      <div className="mapWrap">
        {this.state.addForm &&
          <AddModal toggleAddForm={this.toggleAddForm} />
        }
        {this.state.addByAddressForm &&
          <AddItemByAddress toggleAddForm={this.toggleAddByAddressForm} />
        }

        <div className="container px-lg-5">
          <div className="row mx-lg-n5">
            {this.state.key && this.props.items &&
              <LoadScript
                id="script-loader"
                libraries={libraries}
                googleMapsApiKey={process.env.GOOGLE_MAPS}>

                <GoogleMap
                  id='Traffic-layer-example' mapTypeId='satellite'
                  mapContainerStyle={{ height: mapHeight, width: "100%", borderRadius: ".25rem", boxShadow: "rgba(0, 0, 0, 0.5) 0px 3px 4px -1px" }}
                  options={{ styles: googleMapStyles,  draggableCursor: this.state.addMode ? 'url(/images/cursor.png) 20 50, auto'  : 'pointer', }}
                  zoom={this.state.zoom}
                  center={this.state.center}
                  onClick={this.handleAddPin}>

                  {this.props.items.map((item, index) => {
                    return (
                      <Marker
                        onClick={() => this.openWindow(index)}
                        key={index}
                        position={{ lat: item.lat, lng: item.long }}
                        //icon={this.handleIcons(item.category_id)}
                        icon={`/images/icon${item.category_id}.svg`}
                      >
                        {this.props.items[index] == this.state.activePin && (
                          <InfoWindow
                            onCloseClick={() => this.closeWindow()}
                            position={{ lat: item.lat, lng: item.long }}
                            options={{pixelOffset: new google.maps.Size(0, -40)}}
                            >
                            <div className="info-window">
                              <h4>{this.props.items[index].item_name}</h4>
                              {this.props.items[index].image &&
                                <img className="info-window-image" src={this.props.items[index].image} />}
                              <h6>Description:</h6><p> <em>"{this.props.items[index].description}"</em></p>
                              {this.props.items[index].address ?
                              <>
                              <h6>Address:</h6><p>{this.props.items[index].address}</p>
                              </> :
                              this.props.items[index].suburb ? <><h6>Suburb:</h6><p>{this.props.items[index].suburb }</p></>
                              : null}
                              <h6>Category:</h6><p> {this.state.categoryData[this.props.items[index].category_id - 1].category_name}</p>
                              <h6>Quantity:</h6><p>{this.props.items[index].quantity}</p>
                              <h6>Season:</h6><p> {this.state.seasonData[this.props.items[index].season_id - 1].season_name}</p>
                            </div>
                          </InfoWindow>
                        )}
                      </Marker>
                    )
                  })}

                  { this.props.auth.auth.isAuthenticated ?
                    <div className="addItemContainer">
                      <div className="addPinButton">
                        <button
                          type="button"
                          className="btn btn-light"
                          onClick={this.toggleAddMode}
                          style={{ backgroundColor: this.state.addMode ? "#D25E5D" : "#f8f9fa"}}
                        >{this.state.addMode ? "Stop Adding Items" : "Add Item by Pin"}
                        </button>
                      </div>
                      <div className="addPinButton">
                        <button type="button" className="btn btn-light" onClick={this.toggleAddByAddressForm}>Add Item by Address</button>
                      </div>
                    </div>
                    :
                    <div className="addItemContainer">
                      <div className="addPinButton">
                        <Link to='/login'>
                          <button type="button" className="btn btn-light">Add Item by Pin</button>
                        </Link>
                      </div>
                      <div className="addPinButton">
                        <Link to='/login'>
                          <button type="button" className="btn btn-light">Add Item by Address</button>
                        </Link>
                      </div>
                    </div>
                  }
                </GoogleMap>
              </LoadScript>
            }
          </div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    auth: state,
    currentItem: state.currentItem,
  }
}



export default connect(mapStateToProps, { showAddItemModal, updateItemModal })(Map)
