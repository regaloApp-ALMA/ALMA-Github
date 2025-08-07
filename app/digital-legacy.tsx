import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch } from 'react-native';
import { Stack } from 'expo-router';
import colors from '@/constants/colors';
import { FileText, Info, User, Calendar, Mail, Phone } from 'lucide-react-native';

export default function DigitalLegacyScreen() {
  const [heirName, setHeirName] = useState('');
  const [heirEmail, setHeirEmail] = useState('');
  const [heirPhone, setHeirPhone] = useState('');
  const [activationDate, setActivationDate] = useState('');
  const [message, setMessage] = useState('');
  const [shareFullTree, setShareFullTree] = useState(true);
  const [sharePrivateBranches, setSharePrivateBranches] = useState(false);
  const [sharePasswords, setSharePasswords] = useState(false);

  const handleSave = () => {
    // Aquí iría la lógica para guardar el testamento digital
    alert('Testamento digital guardado correctamente');
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Testamento Digital',
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.white,
        }}
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <FileText size={24} color={colors.primary} />
            <Text style={styles.infoTitle}>¿Qué es el testamento digital?</Text>
          </View>
          <Text style={styles.infoText}>
            El testamento digital te permite designar a una persona de confianza que tendrá acceso a tu árbol de vida en caso de fallecimiento. Así, tus recuerdos y legado digital no se perderán y podrán ser conservados por tus seres queridos.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Designa a tu heredero digital</Text>
          
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <User size={20} color={colors.primary} />
              <Text style={styles.label}>Nombre completo</Text>
            </View>
            <TextInput
              style={styles.input}
              value={heirName}
              onChangeText={setHeirName}
              placeholder="Nombre de tu heredero digital"
              placeholderTextColor={colors.gray}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Mail size={20} color={colors.primary} />
              <Text style={styles.label}>Correo electrónico</Text>
            </View>
            <TextInput
              style={styles.input}
              value={heirEmail}
              onChangeText={setHeirEmail}
              placeholder="Email de contacto"
              placeholderTextColor={colors.gray}
              keyboardType="email-address"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Phone size={20} color={colors.primary} />
              <Text style={styles.label}>Teléfono (opcional)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={heirPhone}
              onChangeText={setHeirPhone}
              placeholder="Número de teléfono"
              placeholderTextColor={colors.gray}
              keyboardType="phone-pad"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Calendar size={20} color={colors.primary} />
              <Text style={styles.label}>Fecha de activación</Text>
            </View>
            <TextInput
              style={styles.input}
              value={activationDate}
              onChangeText={setActivationDate}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={colors.gray}
            />
            <Text style={styles.helperText}>
              Fecha a partir de la cual se activará el testamento si no hay actividad en tu cuenta.
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mensaje personal</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={message}
            onChangeText={setMessage}
            placeholder="Escribe un mensaje personal para tu heredero digital..."
            placeholderTextColor={colors.gray}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿Qué quieres compartir?</Text>
          
          <View style={styles.switchItem}>
            <View>
              <Text style={styles.switchLabel}>Árbol completo</Text>
              <Text style={styles.switchDescription}>
                Incluye todas las ramas y frutos públicos
              </Text>
            </View>
            <Switch
              value={shareFullTree}
              onValueChange={setShareFullTree}
              trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
              thumbColor={shareFullTree ? colors.primary : colors.gray}
            />
          </View>
          
          <View style={styles.switchItem}>
            <View>
              <Text style={styles.switchLabel}>Ramas privadas</Text>
              <Text style={styles.switchDescription}>
                Incluye ramas y frutos marcados como privados
              </Text>
            </View>
            <Switch
              value={sharePrivateBranches}
              onValueChange={setSharePrivateBranches}
              trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
              thumbColor={sharePrivateBranches ? colors.primary : colors.gray}
            />
          </View>
          
          <View style={styles.switchItem}>
            <View>
              <Text style={styles.switchLabel}>Contraseñas guardadas</Text>
              <Text style={styles.switchDescription}>
                Incluye contraseñas y datos sensibles
              </Text>
            </View>
            <Switch
              value={sharePasswords}
              onValueChange={setSharePasswords}
              trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
              thumbColor={sharePasswords ? colors.primary : colors.gray}
            />
          </View>
        </View>
        
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Guardar testamento digital</Text>
        </TouchableOpacity>
        
        <View style={styles.disclaimer}>
          <Info size={16} color={colors.textLight} />
          <Text style={styles.disclaimerText}>
            Tu testamento digital se activará automáticamente si no hay actividad en tu cuenta durante el período especificado. Puedes modificarlo o cancelarlo en cualquier momento.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  infoCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 100,
  },
  helperText: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  switchLabel: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 12,
    color: colors.textLight,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimer: {
    flexDirection: 'row',
    marginBottom: 30,
    paddingHorizontal: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 8,
    lineHeight: 18,
  },
});