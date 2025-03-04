import { useState } from 'react'
import { toast } from 'sonner';

const useFetch = (cb) => {
    const [data, setData] = useState(undefined);
    const [loading, SetLoading] = useState(null);
    const [error, setError] = useState(null);

    const fn = async (...args) => {
        SetLoading(true);
        setError(null)

        try {
            const response = await cb(...args);
            setData(response);
            setError(null)
        } catch (error) {
            setError(error)
            toast.error(error.message)
        } finally {
            SetLoading(false)
        }
    }

    return { data, loading, error, fn, setData }
};

export default useFetch;