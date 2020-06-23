import React, { useState, useEffect } from "react";
import { Feather as Icon } from "@expo/vector-icons";
import { View, ImageBackground, Image, StyleSheet, Text } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import RNPickerSelect, {Item} from 'react-native-picker-select';
import axios from 'axios';

interface IBGEUFResponse {
  sigla: string;
}

interface IBGECityResponse {
  nome: string;
}

const Home = () => {
    const navigation = useNavigation();

    const [ufs, setUfs] = useState<Item[]>([]);
    const [cities, setCities] = useState<Item[]>([]);
    const [selectedUf, setSelectedUf] = useState('PR');
    const [selectedCity, setSelectedCity] = useState('Londrina');

    useEffect(() => {
      axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
        setUfs(response.data.map(uf => ( {label: uf.sigla, value: uf.sigla} )));
      })
    }, [])

    useEffect(() => {
      if (!!selectedUf)
        axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`).then(response => { 
          setCities(response.data.map(city => ( {label: city.nome, value: city.nome} )))
        })
    }, [selectedUf])

    const handleNavigateToPoints = () => {
        navigation.navigate('Points', { selectedUf, selectedCity });
    }

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

    return (
        <ImageBackground 
            source={require('../../assets/home-background.png')} 
            style={styles.container}
            imageStyle={{width: 274, height: 268}}
        >            
            <View style={styles.main}>
                <Image source={require('../../assets/logo.png')}/>
                <Text style={styles.title}>Seu marketplace de coleta de resíduos</Text>
                <Text style={styles.description}>Ajudamos pessoas a encontrarem pontos de coletas de forma eficiente</Text>
            </View>
            <View style={styles.select}>
              <RNPickerSelect
                style={stylesSelect}
                useNativeAndroidPickerStyle={false}
                placeholder={placeholderUf}
                onValueChange={(value) => setSelectedUf(value)}
                value={selectedUf}
                items={ufs}
              />
              <RNPickerSelect 
                style={stylesSelect}
                useNativeAndroidPickerStyle={false}
                placeholder={placeholderCity}
                onValueChange={(value) => setSelectedCity(value)}
                value={selectedCity}
                items={cities}
              />
            </View>
            <View>
                <RectButton style={styles.button} onPress={handleNavigateToPoints}>
                    <View style={styles.buttonIcon}>
                        <Icon name='arrow-right' color='#FFF' size={24}/>    
                    </View>
                    <Text style={styles.buttonText}>Entrar</Text>
                </RectButton>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 32,
    },
  
    main: {
      flex: 1,
      justifyContent: 'center',
    },
  
    title: {
      color: '#322153',
      fontSize: 32,
      fontFamily: 'Ubuntu_700Bold',
      maxWidth: 260,
      marginTop: 64,
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