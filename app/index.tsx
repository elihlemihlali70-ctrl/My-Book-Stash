import { Redirect } from 'expo-router';
import React from 'react';

export default function HomeRoute() {
  return <Redirect href="/login" />;
}
