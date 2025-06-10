import React from 'react';
import {View, Text, FlatList} from 'react-native';

function NotificationList({category, unreadOnly = false}) {
    const notifications = [
        {
            _id: "1",
            category: "ORDER",
            read: {status: false},
            content: {
                title: "🎉 Order Created!",
                body: "Your order #123 has been successfully placed.",
            },
            createdAt: new Date().toISOString(),
        },
        {
            _id: "2",
            category: "DELIVERY",
            read: {status: true},
            content: {
                title: "🚚 Delivery In Progress",
                body: "Your item is on its way and will arrive soon.",
            },
            createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        },
    ];

    return (
        <View style={{flex: 1, backgroundColor: '#fff'}}>
            <FlatList
                data={notifications}
                keyExtractor={(item) => item._id.toString()}
                renderItem={({item}) => (
                    <View style={{
                        padding: 20,
                        // borderBottomWidth: 1,
                        // borderBottomColor: '#ccc',
                    }}>
                        <Text
                            style={{
                                fontSize: 18,
                                marginBottom: 5,
                                fontFamily: 'PoppinsSemiBold',
                                color: item.read.status ? '#6B7280' : '#111827',
                            }}
                        >
                            {item.content.title}
                        </Text>
                        <Text
                            style={{
                                fontSize: 14,
                                color: item.read.status ? '#9CA3AF' : '#111827',
                                fontFamily: 'PoppinsRegular',

                            }}
                        >
                            {item.content.body}
                        </Text>
                    </View>
                )}
            />
        </View>
    );
}

export default NotificationList;
