import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  FlatList,
} from 'react-native';
import { router, Link } from 'expo-router';
import { colors, spacing, typography, commonStyles } from '../styles/commonStyles';
import { mockPrompts, mockCategories } from '../data/mockData';
import PromptCard from '../components/PromptCard';
import CategoryCard from '../components/CategoryCard';
import SearchBar from '../components/SearchBar';
import Icon from '../components/Icon';

export default function Home() {
  const featuredPrompts = mockPrompts.filter(prompt => prompt.featured);
  const popularPrompts = mockPrompts.slice(0, 6);

  const handleSearch = (query: string) => {
    router.push(`/browse?q=${encodeURIComponent(query)}`);
  };

  const renderFeaturedPrompt = ({ item }: { item: any }) => (
    <View style={{ marginRight: spacing.md }}>
      <PromptCard prompt={item} />
    </View>
  );

  const renderCategory = ({ item }: { item: any }) => (
    <View style={{ marginRight: spacing.md }}>
      <CategoryCard category={item} />
    </View>
  );

  return (
    <SafeAreaView style={commonStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView 
        style={commonStyles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      >
        {/* Header */}
        <View style={[commonStyles.padding, { paddingBottom: spacing.md }]}>
          <Text style={[typography.h1, { color: colors.text }]}>Welcome back!</Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
            Discover AI Prompts
          </Text>
          
          <View style={{ marginTop: spacing.lg }}>
            <SearchBar onSearch={handleSearch} placeholder="Search thousands of prompts..." />
          </View>
        </View>

        {/* Featured Prompts */}
        <View style={{ marginBottom: spacing.xl }}>
          <View style={[commonStyles.row, { justifyContent: 'space-between', paddingHorizontal: spacing.lg, marginBottom: spacing.md }]}>
            <Text style={[typography.h2, { color: colors.text }]}>Featured Prompts</Text>
            <Link href="/browse" style={[typography.caption, { color: colors.primary }]}>See All</Link>
          </View>
          <FlatList
            data={featuredPrompts}
            renderItem={renderFeaturedPrompt}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg }}
          />
        </View>

        {/* Browse Categories */}
        <View style={{ marginBottom: spacing.xl }}>
          <View style={[commonStyles.row, { justifyContent: 'space-between', paddingHorizontal: spacing.lg, marginBottom: spacing.md }]}>
            <Text style={[typography.h2, { color: colors.text }]}>Browse Categories</Text>
            <Link href="/browse" style={[typography.caption, { color: colors.primary }]}>See All</Link>
          </View>
          <FlatList
            data={mockCategories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.name}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg }}
          />
        </View>

        {/* Popular This Week */}
        <View style={{ marginBottom: spacing.xl }}>
          <View style={[commonStyles.row, { justifyContent: 'space-between', paddingHorizontal: spacing.lg, marginBottom: spacing.md }]}>
            <Text style={[typography.h2, { color: colors.text }]}>Popular This Week</Text>
            <Link href="/browse" style={[typography.caption, { color: colors.primary }]}>See All</Link>
          </View>
          <View style={[commonStyles.grid, { paddingHorizontal: spacing.lg }]}>
            {popularPrompts.map((prompt) => (
              <View key={prompt.id} style={{ width: '48%', marginBottom: spacing.md }}>
                <PromptCard prompt={prompt} />
              </View>
            ))}
          </View>
        </View>

        {/* Stats Section */}
        <View style={[commonStyles.card, { marginHorizontal: spacing.lg, padding: spacing.lg }]}>
          <Text style={[typography.h3, { color: colors.text, textAlign: 'center', marginBottom: spacing.md }]}>
            Join thousands of creators
          </Text>
          <View style={[commonStyles.row, { justifyContent: 'space-around' }]}>
            <View style={{ alignItems: 'center' }}>
              <Text style={[typography.h2, { color: colors.primary }]}>50K+</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Prompts</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={[typography.h2, { color: colors.primary }]}>10K+</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Creators</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={[typography.h2, { color: colors.primary }]}>1M+</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Downloads</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={commonStyles.bottomNav}>
        <TouchableOpacity style={[commonStyles.navItem, commonStyles.navItemActive]}>
          <Icon name="home" size={24} color={colors.primary} />
          <Text style={[typography.caption, { color: colors.primary, marginTop: spacing.xs }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={commonStyles.navItem}
          onPress={() => router.push('/browse')}
        >
          <Icon name="search" size={24} color={colors.textSecondary} />
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>Browse</Text>
        </TouchableOpacity>
        <TouchableOpacity style={commonStyles.navItem}>
          <Icon name="heart" size={24} color={colors.textSecondary} />
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>Favorites</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={commonStyles.navItem}
          onPress={() => router.push('/profile')}
        >
          <Icon name="user" size={24} color={colors.textSecondary} />
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
