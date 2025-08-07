import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch } from 'react-native';
import { Stack } from 'expo-router';
import colors from '@/constants/colors';
import { Share2, Users, Lock, Copy, Mail, MessageSquare } from 'lucide-react-native';
import { useTreeStore } from '@/stores/treeStore';

export default function ShareTreeScreen() {
  const { tree } = useTreeStore();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [shareFullTree, setShareFullTree] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  const toggleBranchSelection = (branchId: string) => {
    if (selectedBranches.includes(branchId)) {
      setSelectedBranches(selectedBranches.filter(id => id !== branchId));
    } else {
      setSelectedBranches([...selectedBranches, branchId]);
    }
  };

  const handleShare = () => {
    // Aquí iría la lógica para compartir el árbol
    alert('Árbol compartido correctamente');
  };

  const handleCopyLink = () => {
    // Aquí iría la lógica para copiar el enlace
    alert('Enlace copiado al portapapeles');
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Compartir Mi Árbol',
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.white,
        }}
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Share2 size={24} color={colors.primary} />
          <Text style={styles.title}>Comparte tu árbol con seres queridos</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invitar por correo electrónico</Text>
          
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Mail size={20} color={colors.primary} />
              <Text style={styles.label}>Correo electrónico</Text>
            </View>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Introduce el email de la persona"
              placeholderTextColor={colors.gray}
              keyboardType="email-address"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <MessageSquare size={20} color={colors.primary} />
              <Text style={styles.label}>Mensaje personal (opcional)</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Escribe un mensaje personal..."
              placeholderTextColor={colors.gray}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿Qué quieres compartir?</Text>
          
          <View style={styles.switchItem}>
            <View>
              <Text style={styles.switchLabel}>Árbol completo</Text>
              <Text style={styles.switchDescription}>
                Incluye todas las ramas y frutos
              </Text>
            </View>
            <Switch
              value={shareFullTree}
              onValueChange={(value) => {
                setShareFullTree(value);
                if (value) {
                  setSelectedBranches(tree.branches.map(b => b.id));
                } else {
                  setSelectedBranches([]);
                }
              }}
              trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
              thumbColor={shareFullTree ? colors.primary : colors.gray}
            />
          </View>
          
          {!shareFullTree && (
            <View style={styles.branchesContainer}>
              <Text style={styles.branchesTitle}>Selecciona las ramas a compartir:</Text>
              
              {tree.branches.map(branch => (
                <TouchableOpacity
                  key={branch.id}
                  style={styles.branchItem}
                  onPress={() => toggleBranchSelection(branch.id)}
                >
                  <View style={styles.branchInfo}>
                    <View style={[styles.branchDot, { backgroundColor: branch.color }]} />
                    <Text style={styles.branchName}>{branch.name}</Text>
                  </View>
                  
                  <View style={[
                    styles.checkbox,
                    selectedBranches.includes(branch.id) && styles.checkboxSelected
                  ]}>
                    {selectedBranches.includes(branch.id) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enlace para compartir</Text>
          
          <View style={styles.linkContainer}>
            <Text style={styles.linkText} numberOfLines={1}>
              https://alma.app/share/tree/{tree.id}
            </Text>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink}>
              <Copy size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.linkDescription}>
            Este enlace permite a cualquier persona ver las ramas seleccionadas de tu árbol. Puedes revocarlo en cualquier momento.
          </Text>
        </View>
        
        <View style={styles.privacyNote}>
          <Lock size={16} color={colors.textLight} />
          <Text style={styles.privacyText}>
            Tus datos personales y ramas privadas nunca se compartirán sin tu consentimiento explícito.
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.shareButton,
            (!email || selectedBranches.length === 0) && styles.shareButtonDisabled
          ]}
          onPress={handleShare}
          disabled={!email || selectedBranches.length === 0}
        >
          <Users size={20} color={colors.white} />
          <Text style={styles.shareButtonText}>Compartir árbol</Text>
        </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 10,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
    minHeight: 80,
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
  branchesContainer: {
    marginTop: 16,
  },
  branchesTitle: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },
  branchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  branchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  branchDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  branchName: {
    fontSize: 16,
    color: colors.text,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  linkText: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: colors.text,
  },
  copyButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  linkDescription: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 30,
  },
  shareButtonDisabled: {
    backgroundColor: colors.gray,
  },
  shareButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});