import React from 'react';
import GroupsList from './GroupsList';

export default function ExpiredGroups() {
    return <GroupsList isExpired={true} />;
}

