import { useState, useEffect, useCallback } from 'react';
import { pb } from '../lib/pocketbase';

export function usePhotos() {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadPhotos = useCallback(async () => {
        try {
            const records = await pb.collection('photos').getFullList({ sort: '-created' });
            const formatted = records.map(record => ({
                id: record.id,
                dataUrl: pb.files.getURL(record, record.image),
                timestamp: new Date(record.created.replace(' ', 'T')).getTime(),
                record: record
            }));
            setPhotos(formatted);
        } catch (error) {
            if (!error.isAbort) {
                console.error("Failed to load photos from PocketBase", error);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPhotos();
        
        pb.collection('photos').subscribe('*', loadPhotos);
        return () => {
            pb.collection('photos').unsubscribe();
        };
    }, [loadPhotos]);

    const addPhoto = async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        
        try {
            const record = await pb.collection('photos').create(formData);
            return record;
        } catch (error) {
            console.error("Failed to add photo", error);
            throw error;
        }
    };

    const deletePhoto = async (id) => {
        // The id passed in is the PocketBase record id now
        try {
            await pb.collection('photos').delete(id);
        } catch (error) {
            console.error("Failed to delete photo", error);
        }
    };

    return { photos, loading, addPhoto, deletePhoto };
}
