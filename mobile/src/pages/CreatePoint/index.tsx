import React, { useState, useEffect, useRef } from "react";
import { IntentLauncherAndroid } from 'expo';
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { View, Image, StyleSheet, Text, TouchableOpacity,
  Platform, TextInput, Alert, Linking, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { RectButton, ScrollView } from "react-native-gesture-handler";
import MapView, {Marker,PROVIDER_GOOGLE} from 'react-native-maps';
import { Feather as Icon } from "@expo/vector-icons";
import { SvgUri } from "react-native-svg";
import RNPickerSelect, {Item} from 'react-native-picker-select';
import { Formik } from "formik";
import * as Yup from "yup";
import axios from 'axios';
import Api from '../../services/api';
import { ImageInfo } from "expo-image-picker/build/ImagePicker.types";

interface ItemColeta {
  id: number,
  title: string,
  image_url: string
}

interface Point {
  image: string,
  name: string,
  email: string,
  phone: string,
  uf: string,
  city: string,
  lat: number,
  lon: number
}

interface IBGEUFResponse {
  sigla: string;
}

interface IBGECityResponse {
  nome: string;
}

interface Position {
  latitude: number,
  longitude: number,
  latitudeDelta: number,
  longitudeDelta: number,
}

const Home = () => {
    const navigation = useNavigation();

    const [image, setImage] = useState();
    const [ufs, setUfs] = useState<Item[]>([]);
    const [cities, setCities] = useState<Item[]>([]);
    const [selectedUf, setSelectedUf] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [items, setItems] = useState<ItemColeta[]>([]);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [initialPosition, setInitialPosition] = useState<Position>({
      latitude: 0,
      longitude: 0,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421
    });

    const [formData, setFormData] = useState<Point>({
      image: '',
      name: '',
      email: '',
      phone: '',
      uf: '',
      city: '',
      lat: 0,
      lon: 0
    });

    useEffect(() => {
      axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
        setUfs(response.data.map(uf => ( {label: uf.sigla, value: uf.sigla} )));
      })
    }, []);

    useEffect(() => {
      if (!!selectedUf)
        axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`).then(response => { 
          setCities(response.data.map(city => ( {label: city.nome, value: city.nome} )))
        })
    }, [selectedUf]);

    useEffect(() => {
      Api.get('items').then((response) => {
          setItems(response.data);
      });
    }, []);

    var mapRef = useRef<MapView>();
  
    useEffect(() => {
      async function loadPosition() {
        if (!selectedCity) {         
          const { status } = await Location.requestPermissionsAsync();
          if (status !== 'granted') {
              Alert.alert('Localização', 'Precisa de permissão'); 
              return;
          }

          let statusProvider = await Location.getProviderStatusAsync();
          if (!statusProvider.locationServicesEnabled) {            
              if (Platform.OS == 'ios') {
                Linking.openURL('app-settings:');
              } else {
                IntentLauncherAndroid.startActivityAsync(
                  IntentLauncherAndroid.ACTION_LOCATION_SOURCE_SETTINGS
                );
              }
          }

          const location = await Location.getCurrentPositionAsync();

          const {latitude, longitude} = location.coords;
          setInitialPosition({...initialPosition, latitude, longitude});

          const address = await Location.reverseGeocodeAsync({latitude,longitude});
          const cep = address[0].postalCode.replace(/-/g, "");
          const reverseCep = await axios.get(`http://viacep.com.br/ws/${cep}/json/`);
          setFormData({...formData, uf: reverseCep.data.uf, city: reverseCep.data.localidade});

        } else {
          const geocode = await Location.geocodeAsync(selectedCity);
          const {latitude, longitude} = geocode[0];
          setInitialPosition({...initialPosition, latitude, longitude});            
        }
      };

      loadPosition();
    }, [selectedCity]);

    const placeholderUf = {
      label: 'Selecione o estado',
      value: null,
      color: '#9EA0A4',
    };
    const placeholderCity = {
      label: 'Selecione a cidade',
      value: null,
      color: '#9EA0A4',
    };

    function handleSelectedItem(id: number) { 
        const alreadySelected = selectedItems.findIndex(item => item === id);
        if (alreadySelected >= 0) // remove o item caso já foi selecionado
          setSelectedItems(selectedItems.filter(item => item !== id))
        else 
          setSelectedItems([...selectedItems, id]);
    }

    const pickImage = async (handleChange:any) => {
      let result = await ImagePicker.launchImageLibraryAsync() as ImageInfo;
      console.log(result)
      const file = {
        uri: result.uri,
        name: result.uri.split('/').pop(),
        type: result.type+'/'+result.uri.split('.').pop()
      }
      setImage(file);
      if (!result.cancelled) {
        handleChange(result.uri)
      }
    }

    function handleSubmit(form: Point, { setSubmitting }: any) {
      const data = new FormData();
      data.append('name', form.name);
      data.append('email', form.email);
      data.append('phone', form.phone);
      data.append('uf', form.uf);
      data.append('city', form.city);
      data.append('lat', String(initialPosition.latitude));
      data.append('lon', String(initialPosition.longitude));
      data.append('items', selectedItems.join(','));
      if (image) {
        data.append('image', image)
      }
      Api.post('points', data).then(Response=> {
        setSubmitting(false);
        navigation.navigate('Home');
      });
    }
    
    const regexPhone = /^(\+?\d{0,4})?\s?-?\s?(\(?\d{3}\)?)\s?-?\s?(\(?\d{3}\)?)\s?-?\s?(\(?\d{4}\)?)?$/;

    const validationSchema = Yup.object().shape({
      name: Yup.string().required('Nome é obrigatório'),
      email: Yup.string().email('Email não foi preenchido corretamente'),
      phone: Yup.string().matches(regexPhone, 'Telefone não foi preenchido corretamente'),
      uf: Yup.string().required('Estado é obrigatório'),
      city: Yup.string().required('Cidade é obrigatório'),
    });

    return (
      <View style={styles.container}>        
        <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.main}>
            <Text style={styles.title}>Cadastro do Ponto de Coleta</Text>
        </View>  
        <View style={styles.form}>
          <Formik
            enableReinitialize
            initialValues={formData}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ handleChange, handleBlur, handleSubmit, setFieldValue, setSubmitting, values, errors, touched, isValid, isSubmitting }) => (
              <View>
                
                <RectButton
                  style={styles.uploadImage}
                  onPress={() => {pickImage(handleChange('image'))}}
                > 
                  <Text style={styles.uploadImageText}>Selecionar imagem da galeria</Text>
                </RectButton>
                { values.image && values.image.length > 0 ?  
                  <Image source={{ uri: values.image }} style={styles.image} /> : null
                }

                { (errors.name && touched.name) && 
                  <Text style={styles.helperText}>{errors.name}</Text>
                }
                <TextInput
                  placeholder={'Nome'}
                  onChangeText={handleChange('name')}
                  onBlur={handleBlur('name')}
                  value={values.name}
                  style={stylesSelect.inputAndroid}
                  autoCompleteType={"name"}
                />
                { (errors.email && touched.email) && 
                  <Text style={styles.helperText}>{errors.email}</Text>
                }
                <TextInput
                  placeholder={'Email'}
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  value={values.email}
                  style={stylesSelect.inputAndroid}
                  autoCompleteType={"email"}
                  keyboardType={"email-address"}
                />
                { (errors.phone && touched.phone) && 
                  <Text style={styles.helperText}>{errors.phone}</Text>
                }
                <TextInput
                  placeholder={'Telefone'}
                  onChangeText={handleChange('phone')}
                  onBlur={handleBlur('phone')}
                  value={values.phone}
                  style={stylesSelect.inputAndroid}
                  autoCompleteType={"tel"}
                  keyboardType={"phone-pad"}                      
                />
                { (errors.uf && touched.uf) && 
                  <Text style={styles.helperText}>{errors.uf}</Text>
                }
                <RNPickerSelect
                  style={stylesSelect}
                  useNativeAndroidPickerStyle={false}
                  placeholder={placeholderUf}
                  onValueChange={(v) => {
                    setFieldValue('uf', v);
                    setSelectedUf(v);
                  }}
                  value={values.uf}
                  items={ufs}
                />
                { (errors.city && touched.city) && 
                  <Text style={styles.helperText}>{errors.city}</Text>
                }
                <RNPickerSelect
                  style={stylesSelect}
                  useNativeAndroidPickerStyle={false}
                  placeholder={placeholderCity}
                  onValueChange={(v) => {
                    setFieldValue('city', v);
                    setSelectedCity(v);
                  }}
                  value={values.city}
                  items={cities}
                />
                {!!selectedCity && <Text>Selecione o endereço no mapa</Text>}
                <View style={styles.mapContainer}>
                  { initialPosition.latitude !== 0 &&
                    <MapView       
                      provider={PROVIDER_GOOGLE}               
                      showsUserLocation                      
                      showsMyLocationButton={true}
                      zoomControlEnabled={true}
                      loadingEnabled={initialPosition.latitude===0}
                      style={styles.map} 
                      region={{latitude: initialPosition.latitude, longitude: initialPosition.longitude, latitudeDelta: initialPosition.latitudeDelta, longitudeDelta: initialPosition.longitudeDelta}}
                      onRegionChangeComplete={(region)=> setInitialPosition(region)}
                    >
                      <Marker coordinate={{latitude: initialPosition.latitude, longitude: initialPosition.longitude}}/>
                    </MapView> 
                  }
                </View>  

                <Text style={{marginTop: 16}}>Selecione um ou mais itens de coleta</Text>
                <View style={styles.itemsContainer}>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                    >
                        {items.map(item => (
                            <TouchableOpacity 
                                key={String(item.id)} 
                                style={[styles.item, selectedItems.includes(item.id) ? styles.selectedItem : {}]} 
                                onPress={()=>handleSelectedItem(item.id)}
                                activeOpacity={0.6}
                            >
                                <SvgUri width={42} height={42} uri={item.image_url}/>
                                <Text style={styles.itemTitle}>{item.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <RectButton 
                  style={styles.button} 
                  onPress={handleSubmit} 
                  disabled={!isValid || isSubmitting}
                >
                    <View style={styles.buttonIcon}>
                      { isSubmitting ?
                        <Icon name='loader' color='#FFF' size={24}/> :
                        <Icon name='save' color='#FFF' size={24}/>    
                      }
                    </View>
                    <Text style={styles.buttonText}>Cadastrar</Text>
                </RectButton>
              </View>
            )}
          </Formik>  
        </View>  
        </ScrollView>
    </View>
    );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop  : 32,
    },
  
    main: {
      flex: 1,
      justifyContent: 'center',
      marginTop: 10,
      paddingHorizontal: 32,
    },

    form: {
      marginTop: 16,
      paddingHorizontal: 32,
    },
  
    title: {
      color: '#322153',
      fontSize: 32,
      fontFamily: 'Ubuntu_700Bold',
      maxWidth: 260,
    },
  
    description: {
      color: '#6C6C80',
      fontSize: 16,
      marginTop: 16,
      fontFamily: 'Roboto_400Regular',
      maxWidth: 260,
      lineHeight: 24,
    },
  
    select: {
      marginBottom: 10,
    },
    
    button: {
      backgroundColor: '#34CB79',
      height: 60,
      flexDirection: 'row',
      borderRadius: 10,
      overflow: 'hidden',
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 16,
    },
  
    buttonIcon: {
      height: 60,
      width: 60,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      borderBottomLeftRadius: 10,
      borderTopLeftRadius: 10,
      justifyContent: 'center',
      alignItems: 'center'
    },
  
    buttonText: {
      flex: 1,
      justifyContent: 'center',
      textAlign: 'center',
      color: '#FFF',
      fontFamily: 'Roboto_500Medium',
      fontSize: 16,
    },

    helperText: {
      marginLeft: 25,
      color: 'red'
    },

    mapContainer: {      
      width: '100%',
      height: 250,
      borderRadius: 10,
      overflow: 'hidden',
      marginTop: 16,
    },
  
    map: {
      width: '100%',
      height: '100%',
    },

    itemsContainer: {
      flexDirection: 'row',
      marginTop: 16,
      marginBottom: 16,
    },
  
    item: {
      backgroundColor: '#fff',
      borderWidth: 2,
      borderColor: '#eee',
      height: 120,
      width: 120,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 16,
      marginRight: 8,
      alignItems: 'center',
      justifyContent: 'space-between',
  
      textAlign: 'center',
    },
  
    selectedItem: {
      borderColor: '#34CB79',
      borderWidth: 2,
    },
  
    itemTitle: {
      fontFamily: 'Roboto_400Regular',
      textAlign: 'center',
      fontSize: 13,
    },

    uploadImage: {
      height: 50,
      backgroundColor: '#E1FAEC',
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 16,
      marginBottom: 16,
    },
    
    image: {
      justifyContent: 'center',
      alignItems: 'center',
      height: 200,
      flex: 1,
      resizeMode: 'contain',
      marginBottom: 16,
    },
    
    uploadImageText: {
      paddingTop: '4%',
      paddingBottom: '4%',
      paddingLeft: '20%',
      paddingRight: '20%',
      borderRadius: 10,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: '#4ECB79',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#333',
    }
});


const stylesSelect = StyleSheet.create({
  inputIOS: {
    height: 60,
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 8,
    paddingHorizontal: 24,
    fontSize: 16
  },
  inputAndroid: {
    height: 60,
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 8,
    paddingHorizontal: 24,
    fontSize: 16,
  }
});

export default Home;