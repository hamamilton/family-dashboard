import { useState, useEffect } from 'react';

const DB_NAME = 'FamilyDashboardPhotosDB';
const STORE_NAME = 'photos';

const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export function usePhotos() {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPhotos();
    }, []);

    const loadPhotos = async () => {
        try {
            const db = await openDB();
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();
            
            request.onsuccess = () => {
                // Sort by timestamp descending so newest are first
                const sorted = request.result.sort((a, b) => b.timestamp - a.timestamp);
                setPhotos(sorted);
                setLoading(false);
            };
        } catch (error) {
            console.error("Failed to load photos from IndexedDB", error);
            setLoading(false);
        }
    };

    const addPhoto = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const newPhoto = {
                    id: Date.now().toString(),
                    dataUrl: reader.result,
                    timestamp: Date.now()
                };

                try {
                    const db = await openDB();
                    const transaction = db.transaction(STORE_NAME, 'readwrite');
                    const store = transaction.objectStore(STORE_NAME);
                    store.add(newPhoto);

                    transaction.oncomplete = () => {
                        setPhotos(prev => [newPhoto, ...prev]);
                        resolve(newPhoto);
                    };
                } catch (error) {
                    console.error("Failed to add photo", error);
                    reject(error);
                }
            };
            reader.onerror = error => reject(error);
        });
    };

    const deletePhoto = async (id) => {
        try {
            const db = await openDB();
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            store.delete(id);

            transaction.oncomplete = () => {
                setPhotos(prev => prev.filter(p => p.id !== id));
            };
        } catch (error) {
            console.error("Failed to delete photo", error);
        }
    };

    return { photos, loading, addPhoto, deletePhoto };
}
