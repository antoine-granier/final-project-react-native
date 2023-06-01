import { useEffect, useState } from "react"
import { ActivityIndicator, Button, FlatList, Image, Text, TouchableOpacity, View } from "react-native"
import SelectDropdown from "react-native-select-dropdown"
import axios from "axios";
import { useSelector } from "react-redux";
import { selectItems } from "../connexionInfoSlice";
import * as FileSystem from 'expo-file-system';
import { Asset, useAssets } from 'expo-asset';
import Play from '../assets/play.png'
import Pause from '../assets/pause.png'
import { Audio } from "expo-av";
import Checkbox from "expo-checkbox";
import * as DocumentPicker from 'expo-document-picker';


function RaveView({ type, models }) {
    const connexionInfo = useSelector(selectItems)
    const [assets, error] = useAssets([require('../assets/demo.wav')])
    const [uri, setUri] = useState(undefined)
    const [loading, setLoading] = useState(false)
    const [recordList, setRecordList] = useState([]);
    const [sendUri, setSendUri] = useState(undefined)

    async function readDirectory() {
        try {
            const dir = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory + 'recordings');
            let tmpList = []
            dir.forEach((file, index) => {
                tmpList.push({ key: index, path: FileSystem.documentDirectory + 'recordings/' + file, name: file })
            })
            setRecordList(tmpList);
        } catch (err) {
            console.log("No directory recording")
        }
    }

    useEffect(() => {
        if (type == "YOUR_SOUNDS")
            readDirectory();
    }, [])

    // Send file function
    const sendFile = async (uri) => {
        setLoading(true)
        resp = await FileSystem.uploadAsync("http://" + connexionInfo.ip + ":" + connexionInfo.port + "/upload", uri, {
            fieldName: 'file',
            httpMethod: 'POST',
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            headers: { filename: uri }
        })
        console.log(resp.body)
        await downloadFile()
    }

    // Download file to document directory
    const downloadFile = async () => {
        // Create a directory in the app document directory
        const dirInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory + "download");
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(
                FileSystem.documentDirectory + "download",
                { intermediates: true }
            );
        }

        // Download file
        const { uri } = await FileSystem.downloadAsync("http://" + connexionInfo.ip + ":" + connexionInfo.port + "/download", FileSystem.documentDirectory + "download" + "/" + new Date().getTime() + ".wav")
        setUri(uri)
        setLoading(false)
    }

    const pickDocument = async () => {
        let result = await DocumentPicker.getDocumentAsync({ type: ["audio/wav", "audio/mp3"] });
        setSendUri(result.uri);

    }

    const SoundView = ({ name, uri }) => {

        const [sound, setSound] = useState(undefined)

        async function playSound(path) {
            console.log('Requesting permissions..');
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });
            console.log('Loading Sound');
            const { sound } = await Audio.Sound.createAsync({ uri: path }, { shouldPlay: true });
            setSound(sound);

            console.log('Playing Sound');
            await sound.playAsync();
            sound.setOnPlaybackStatusUpdate(async (playbackStatus) => {
                if (playbackStatus.didJustFinish) {
                    await sound.unloadAsync();
                    setSound(undefined);
                }
            })
        }

        const stopSound = async () => {
            await sound.unloadAsync()
            setSound(undefined)
        }

        return (<View style={{ flexDirection: "row", width: "50%", justifyContent: "space-between", backgroundColor: "#ddd", padding: 10, margin: 10, borderRadius: 5 }}>
            <Text style={{ fontSize: 15, fontWeight: "bold" }}>{name}</Text>
            <TouchableOpacity onPress={() =>
                sound ?
                    stopSound()
                    :
                    playSound(uri)}>
                <Image source={sound ? Pause : Play} style={{ width: 20, height: 20 }} />
            </TouchableOpacity>
        </View>)
    }

    return (
        <View style={{ flex: 1, alignItems: "center", gap: 10, marginBottom: 40 }}>
            {(type == "DEFAULT" && assets != undefined) &&
                <SoundView name={assets[0].name} uri={assets[0].localUri} />
            }
            {type == "YOUR_SOUNDS" &&
                <>
                    {
                        recordList.length > 0 ?
                            <FlatList
                                contentContainerStyle={{ gap: 10 }}
                                data={recordList}
                                renderItem={({ item }) => {
                                    return (
                                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20 }}>
                                            <SoundView name={item.name} uri={item.path} />
                                            <Checkbox value={sendUri == item.path} onValueChange={() => setSendUri(item.path)} />
                                        </View>
                                    )
                                }}
                                keyExtractor={item => item.key}
                            />
                            : <Text style={{ marginTop: 30 }}>No record your phone.</Text>
                    }
                </>
            }
            {type == "BROWSE" &&
                <>
                    <Button title="Browse file" onPress={pickDocument} />
                    {sendUri &&
                        <SoundView name="audio" uri={sendUri} />
                    }
                </>
            }
            <SelectDropdown
                data={models}
                defaultValue={models[0]}
                onSelect={(selectedItem, index) => axios.get(`http://${connexionInfo.ip}:${connexionInfo.port}/selectModel/${selectedItem}`).then(res => console.log("set model to " + selectedItem)).catch(err => console.log(err))}
            />
            <Button title="Modify sound" onPress={() => {
                setUri(undefined)
                if (type == "DEFAULT") {
                    sendFile(assets[0].localUri)
                } else if (sendUri) {
                    sendFile(sendUri)
                } else {
                    alert("You have to choose an audio.")
                }
            }} />
            {loading &&
                <ActivityIndicator size={"large"} />
            }
            {uri &&
                <SoundView name="Result" uri={uri} />
            }
        </View>
    )
}

export default RaveView