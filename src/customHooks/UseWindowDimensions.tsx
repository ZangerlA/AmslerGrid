import {useEffect, useState} from 'react';

export type Dimension = {
    currentDimension: {width: number, height: number},
    previousDimension: {width: number, height: number},
}

function getWindowDimensions() {
    const { innerWidth: width, innerHeight: height } = window
    return {
        width,
        height,
    };
}

export default function useWindowDimensions(): Dimension {
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());
    const [ previousWindowDimensions, setPreviousWindowDimensions ] = useState(getWindowDimensions())

    useEffect(() => {
        function handleResize() {
            setPreviousWindowDimensions(windowDimensions)
            setWindowDimensions(getWindowDimensions());
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return {currentDimension: windowDimensions, previousDimension: previousWindowDimensions};
}
