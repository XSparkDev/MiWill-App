import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme.config';
import { codCalculatorStyles as styles } from './CODCalculatorScreen.styles';

interface CODCalculatorScreenProps {
  navigation: any;
}

interface CalculationResults {
  funeralCost: number;
  executorFee: number;
  executorFeeVAT: number;
  masterOfficeFee: number;
  legalAdminFees: number;
  estateDuty: number;
  otherTaxes: number;
  totalCostOfDying: number;
}

const CODCalculatorScreen: React.FC<CODCalculatorScreenProps> = ({ navigation }) => {
  // Input states
  const [funeralCost, setFuneralCost] = useState('');
  const [grossEstateValue, setGrossEstateValue] = useState('');
  const [legalAdminFees, setLegalAdminFees] = useState('');
  const [otherTaxes, setOtherTaxes] = useState('');
  
  // Results state
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Format number with thousands separator
  const formatCurrency = (value: string): string => {
    const num = value.replace(/[^0-9]/g, '');
    if (!num) return '';
    return parseFloat(num).toLocaleString('en-ZA');
  };

  // Parse formatted currency back to number
  const parseCurrency = (value: string): number => {
    return parseFloat(value.replace(/[^0-9]/g, '') || '0');
  };

  // Calculate Master's Office Fee
  const calculateMasterOfficeFee = (grossValue: number): number => {
    if (grossValue < 250000) {
      return 0;
    }
    
    // Simplified tier-based calculation
    // For estates >= R250,000, using a progressive scale
    if (grossValue >= 250000 && grossValue < 500000) {
      return 600;
    } else if (grossValue >= 500000 && grossValue < 1000000) {
      return 1000;
    } else if (grossValue >= 1000000 && grossValue < 2500000) {
      return 1500;
    } else if (grossValue >= 2500000 && grossValue < 5000000) {
      return 2500;
    } else {
      return 4000;
    }
  };

  // Calculate Estate Duty
  const calculateEstateDuty = (dutiableValue: number): number => {
    const exemption = 3500000;
    
    if (dutiableValue <= exemption) {
      return 0;
    }
    
    if (dutiableValue <= 30000000) {
      return 0.20 * (dutiableValue - exemption);
    }
    
    // Above R30 million
    const firstBracket = 0.20 * (30000000 - exemption);
    const secondBracket = 0.25 * (dutiableValue - 30000000);
    return firstBracket + secondBracket;
  };

  // Main calculation function
  const calculateCOD = () => {
    const F = parseCurrency(funeralCost);
    const GV = parseCurrency(grossEstateValue);
    const LF = parseCurrency(legalAdminFees);
    const OT = parseCurrency(otherTaxes);

    // Validate inputs
    if (F === 0 || GV === 0) {
      Alert.alert('Validation Error', 'Please enter at least the Funeral Cost and Gross Estate Value.');
      return;
    }

    // Calculate Executor's Fee (3.5% of Gross Estate)
    const EF = 0.035 * GV;

    // Calculate VAT on Executor's Fee (15%)
    const EFVAT = 0.15 * EF;

    // Calculate Master's Office Fee
    const MF = calculateMasterOfficeFee(GV);

    // Calculate Estate Duty (using Gross Value as approximation for Dutiable Value)
    const ED = calculateEstateDuty(GV);

    // Calculate Total Estate Settlement Cost
    const TCD = F + EF + EFVAT + MF + LF + ED + OT;

    setResults({
      funeralCost: F,
      executorFee: EF,
      executorFeeVAT: EFVAT,
      masterOfficeFee: MF,
      legalAdminFees: LF,
      estateDuty: ED,
      otherTaxes: OT,
      totalCostOfDying: TCD,
    });

    setShowResults(true);
  };

  const resetCalculator = () => {
    setFuneralCost('');
    setGrossEstateValue('');
    setLegalAdminFees('');
    setOtherTaxes('');
    setResults(null);
    setShowResults(false);
  };

  const formatResultCurrency = (value: number): string => {
    return `R ${value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>COD Calculator</Text>
          <TouchableOpacity onPress={resetCalculator} style={styles.resetButton}>
            <Ionicons name="refresh" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={theme.colors.info} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Cost of Death Calculator</Text>
              <Text style={styles.infoText}>
                Estimate the unavoidable expenses that arise during the estate settlement process in South Africa.
              </Text>
            </View>
          </View>

          {/* Input Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Required Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Funeral Cost Estimate *</Text>
              <Text style={styles.inputHint}>Industry range: R3,000 - R50,000</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencyPrefix}>R</Text>
                <TextInput
                  style={styles.input}
                  placeholder="20,000"
                  placeholderTextColor={theme.colors.placeholder}
                  value={funeralCost}
                  onChangeText={(text) => setFuneralCost(formatCurrency(text))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gross Estate Value *</Text>
              <Text style={styles.inputHint}>Total value of all assets before debts</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencyPrefix}>R</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1,000,000"
                  placeholderTextColor={theme.colors.placeholder}
                  value={grossEstateValue}
                  onChangeText={(text) => setGrossEstateValue(formatCurrency(text))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Legal & Admin Fees (Optional)</Text>
              <Text style={styles.inputHint}>Typical range: R1,000 - R8,000</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencyPrefix}>R</Text>
                <TextInput
                  style={styles.input}
                  placeholder="5,000"
                  placeholderTextColor={theme.colors.placeholder}
                  value={legalAdminFees}
                  onChangeText={(text) => setLegalAdminFees(formatCurrency(text))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Other Taxes/Transfer Costs (Optional)</Text>
              <Text style={styles.inputHint}>Property transfer, conveyancing fees, etc.</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencyPrefix}>R</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={theme.colors.placeholder}
                  value={otherTaxes}
                  onChangeText={(text) => setOtherTaxes(formatCurrency(text))}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Calculate Button */}
          <TouchableOpacity
            style={styles.calculateButton}
            onPress={calculateCOD}
          >
            <Ionicons name="calculator" size={20} color={theme.colors.buttonText} />
            <Text style={styles.calculateButtonText}>Calculate Total Cost</Text>
          </TouchableOpacity>

          {/* Results Section */}
          {showResults && results && (
            <View style={styles.resultsSection}>
              <View style={styles.resultsTitleContainer}>
                <Ionicons name="receipt" size={24} color={theme.colors.success} />
                <Text style={styles.resultsTitle}>Calculation Results</Text>
              </View>

              <View style={styles.resultsCard}>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Funeral Cost (F)</Text>
                  <Text style={styles.resultValue}>{formatResultCurrency(results.funeralCost)}</Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Executor's Fee (3.5% of GV)</Text>
                  <Text style={styles.resultValue}>{formatResultCurrency(results.executorFee)}</Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>VAT on Executor's Fee (15%)</Text>
                  <Text style={styles.resultValue}>{formatResultCurrency(results.executorFeeVAT)}</Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Master's Office Fees</Text>
                  <Text style={styles.resultValue}>{formatResultCurrency(results.masterOfficeFee)}</Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Legal & Admin Fees</Text>
                  <Text style={styles.resultValue}>{formatResultCurrency(results.legalAdminFees)}</Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Estate Duty</Text>
                  <Text style={styles.resultValue}>{formatResultCurrency(results.estateDuty)}</Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Other Taxes/Transfers</Text>
                  <Text style={styles.resultValue}>{formatResultCurrency(results.otherTaxes)}</Text>
                </View>

                <View style={styles.resultDivider} />

                <View style={[styles.resultRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Estate Settlement Cost</Text>
                  <Text style={styles.totalValue}>{formatResultCurrency(results.totalCostOfDying)}</Text>
                </View>
              </View>

              {/* Formula Reference */}
              <View style={styles.formulaCard}>
                <Text style={styles.formulaTitle}>Formula Used:</Text>
                <Text style={styles.formulaText}>
                  TCD = F + EF + EFVAT + MF + LF + ED + OT
                </Text>
                <Text style={styles.formulaNote}>
                  Based on South African regulatory standards and SARS rates.
                </Text>
              </View>
            </View>
          )}

          {/* Educational Info */}
          <View style={styles.educationalSection}>
            <Text style={styles.educationalTitle}>Understanding the Components</Text>

            <View style={styles.educationalItem}>
              <Ionicons name="flower" size={20} color={theme.colors.primary} />
              <View style={styles.educationalContent}>
                <Text style={styles.educationalItemTitle}>Funeral Cost (F)</Text>
                <Text style={styles.educationalItemText}>
                  Your estimated cost for funeral services, memorial arrangements, and related expenses.
                </Text>
              </View>
            </View>

            <View style={styles.educationalItem}>
              <Ionicons name="briefcase" size={20} color={theme.colors.primary} />
              <View style={styles.educationalContent}>
                <Text style={styles.educationalItemTitle}>Executor's Fee (EF)</Text>
                <Text style={styles.educationalItemText}>
                  Standard rate of 3.5% of the gross estate value, confirmed by SA law.
                </Text>
              </View>
            </View>

            <View style={styles.educationalItem}>
              <Ionicons name="cash" size={20} color={theme.colors.primary} />
              <View style={styles.educationalContent}>
                <Text style={styles.educationalItemTitle}>Estate Duty (ED)</Text>
                <Text style={styles.educationalItemText}>
                  20% on first R30 million (above R3.5M exemption), 25% above that.
                </Text>
              </View>
            </View>

            <View style={styles.educationalItem}>
              <Ionicons name="document-text" size={20} color={theme.colors.primary} />
              <View style={styles.educationalContent}>
                <Text style={styles.educationalItemTitle}>Master's Office Fees (MF)</Text>
                <Text style={styles.educationalItemText}>
                  Tariff-based fees for estates over R250,000, scaling with estate value.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default CODCalculatorScreen;

