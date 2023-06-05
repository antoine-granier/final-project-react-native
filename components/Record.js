import { Text, View, StyleSheet, Button, Modal, TextInput, ToastAndroid, TouchableOpacity, FlatList, Image } from 'react-native';
import { Audio } from 'expo-av';
import { useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system';
import Cross from '../assets/close.png'
import Play from '../assets/play.png'
import Pause from '../assets/pause.png'

function Record({ navigation, route }) {


    const [recording, setRecording] = useState(undefined);
    const [time, setTime] = useState(0);
    const [running, setRunning] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [recordName, setRecordName] = useState("");
    const [recordUri, setRecordUri] = useState(undefined);
    const [recordList, setRecordList] = useState([]);

    useEffect(() => {
        let interval;
        if (running) {
            interval = setInterval(() => {
                setTime((prevTime) => prevTime + 10);
            }, 10);
        } else if (!running) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [running]);

    useEffect(() => {
        readDirectory();
    }, [])

    async function startRecording() {
        try {
            console.log('Requesting permissions..');
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            console.log('Starting recording..');
            setRunning(true)
            const { recording } = await Audio.Recording.createAsync(
                {
                    isMeteringEnabled: true,
                    android: {
                        extension: '.wav',
                        sampleRate: 44100,
                        numberOfChannels: 2,
                        bitRate: 128000,
                    },
                    ios: {
                        extension: '.wav',
                        sampleRate: 44100,
                        numberOfChannels: 2,
                        bitRate: 128000,
                        linearPCMBitDepth: 16,
                        linearPCMIsBigEndian: false,
                        linearPCMIsFloat: false,
                    },
                    web: {
                        mimeType: 'audio/webm',
                        bitsPerSecond: 128000,
                    },
                }
            );
            setRecording(recording);
            console.log('Recording started');
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    }

    async function stopRecording() {
        setRunning(false)
        console.log('Stopping recording..');
        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
        });
        const uri = recording.getURI();
        setRecordUri(uri);
        console.log('Recording stopped and stored at', uri);
    }

    async function saveRecord() {
        try {
            const dirInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory + "recordings/");
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(
                    FileSystem.documentDirectory + "recordings/",
                    { intermediates: true }
                );
            }
            const newPath = FileSystem.documentDirectory + "recordings/" + recordName.replace(/\s+/g, "") + ".wav";
            await FileSystem.moveAsync({
                from: recordUri,
                to: newPath,
            });
            setRecording(undefined);
            setRecordUri(undefined);
            setModalVisible(false);
            setTime(0)
            // ToastAndroid.show("Your record was saved.", ToastAndroid.SHORT);
            readDirectory();
        } catch (err) {
            console.log(err)
            setModalVisible(false);
            // ToastAndroid.show("Impossible to save your record", ToastAndroid.SHORT);
        }
    }

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

    async function deleteRecord(uri) {
        try {
            await FileSystem.deleteAsync(uri);
            setRecordList(recordList.filter(record => record.path !== uri));
        } catch (err) {
            console.log(err);
            // ToastAndroid.show("Impossible to delete this record.", ToastAndroid.SHORT);
        }
    }

    const RecordLine = ({ item }) => {

        const [sound, setSound] = useState(undefined);

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
            // await sound.unloadAsync()
            setSound(undefined)
        }

        return (
            <View style={{ flexDirection: "row", width: "100%", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 15, fontWeight: "bold" }} key={item.key}>{item.name}</Text>
                <View style={{ flexDirection: "row", gap: 20 }}>
                    <TouchableOpacity onPress={() =>
                        sound ?
                            stopSound()
                            :
                            playSound(item.path)}>
                        <Image source={sound ? Pause : Play} style={{ width: 20, height: 20 }} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteRecord(item.path)}>
                        <Image source={Cross} style={{ width: 20, height: 20 }} />
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <Text style={styles.timer}>{("0" + Math.floor((time / 60000) % 60)).slice(-2)}:{("0" + Math.floor((time / 1000) % 60)).slice(-2)}:{("0" + ((time / 10) % 100)).slice(-2)}</Text>
            <Button
                title={recording ? 'Stop Recording' : 'Start Recording'}
                onPress={recording ? stopRecording : startRecording}
            />
            <Button
                title='Reset'
                onPress={() => { setTime(0); setRecording(undefined) }}
            />
            {(recording && !running) &&
                <Button title='Save Record' onPress={() => setModalVisible(true)} />
            }

            <FlatList
                contentContainerStyle={{ gap: 10 }}
                data={recordList}
                renderItem={({ item }) => {
                    return (
                        <RecordLine item={item} />
                    )
                }}
                keyExtractor={item => item.key}
            />

            <Button title='Modify sound' onPress={() => navigation.navigate("Rave")} />

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
            >
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <View style={styles.overlay}>
                        <View style={styles.modalView}>
                            <Text style={{ textAlign: "center", fontSize: 18, fontWeight: "bold", marginBottom: 30 }}>Save your record</Text>
                            <Text>Name:</Text>
                            <TextInput style={{ width: "80%", elevation: 10, backgroundColor: "white", padding: 10, borderRadius: 5, marginTop: 10, marginBottom: 30 }} onChangeText={(e) => setRecordName(e)} />
                            <Button title='Save' onPress={saveRecord} />
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#ecf0f1',
        padding: 10,
    },
    timer: {
        textAlign: 'center',
        paddingBottom: 30,
        fontSize: 20,
        fontWeight: 'bold'
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    overlay: {
        height: "100%",
        backgroundColor: '#000000B8',
        justifyContent: "center"
    }
});

export default Record