import axios from "axios"
import { useEffect, useState } from "react"
import { Button, Text, TextInput, ToastAndroid, View } from "react-native"

function Home({navigation, route}) {

    const [ip, setIp] = useState("")
    const [port, setPort] = useState(0)

    const initialiseConnexion = () => {
        if (ip !== "" && port !== 0) {
            console.log(`http://${ip}:${port}`)
            axios.get(`http://${ip}:${port}`).then(res => {
                console.log(res.data)
                ToastAndroid.show(res.data, ToastAndroid.SHORT)
                navigation.navigate("Record")
            }).catch(err => {
                ToastAndroid.show("Connexion failed !", ToastAndroid.SHORT)
            })
        }
    }

    return (
        <View style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 30 }}>
            <Text>IP:</Text>
            <TextInput style={{ width: "80%", elevation: 10, backgroundColor: "white", padding: 10, borderRadius: 5, marginTop: 10, marginBottom: 10 }} placeholder="127.0.0.1" onChangeText={(e) => setIp(e)} />
            <Text>Port:</Text>
            <TextInput style={{ width: "80%", elevation: 10, backgroundColor: "white", padding: 10, borderRadius: 5, marginTop: 10, marginBottom: 20 }} placeholder="8000" onChangeText={(e) => setPort(e)} />
            <Button title="Connexion" onPress={initialiseConnexion} />
        </View>
    )
}

export default Home