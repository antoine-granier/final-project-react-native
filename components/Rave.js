import axios from "axios";
import { useEffect, useState } from "react";
import { Button, Text, View, useWindowDimensions } from "react-native";
import { useSelector } from "react-redux";
import { selectItems } from '../connexionInfoSlice'
import { SceneMap, TabView } from "react-native-tab-view";
import RaveView from "./RaveView";

function Rave() {

    const [models, setModels] = useState([])

    const connexionInfo = useSelector(selectItems)

    const getModels = () => {
        axios.get(`http://${connexionInfo.ip}:${connexionInfo.port}/getmodels`).then(res => setModels(res.data.models))
    }

    useEffect(() => {
        getModels()
    }, [])

    const renderScene = SceneMap({
        default: () => (<RaveView type={"DEFAULT"} models={models} />),
        sounds: () => (<RaveView type={"YOUR_SOUNDS"} models={models} />),
        browse: () => (<RaveView type={"BROWSE"} models={models} />)
    });

    const layout = useWindowDimensions();

    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'default', title: 'Default' },
        { key: 'sounds', title: 'Your sounds' },
        { key: 'browse', title: 'Browse' }
    ]);

    return (
        <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={setIndex}
            initialLayout={{ width: layout.width }}
        />
    );
}

export default Rave